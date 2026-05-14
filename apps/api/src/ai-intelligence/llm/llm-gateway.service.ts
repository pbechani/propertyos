import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmCompletion, LlmCompletionOptions, LlmMessage, LlmProvider } from './llm-gateway.types';

// ─────────────────────────────────────────────────────────────────────────────
// LLM Gateway Service
//
// Unified abstraction over multiple LLM providers (PDR-007).
//
//   Supported providers:
//     • openai    — GPT-4o-mini (default) via OpenAI Chat Completions API
//     • anthropic — Claude 3 Haiku via Anthropic Messages API
//     • gemini    — Gemini 1.5 Flash via Google Generative Language API
//
//   Configuration (all optional — LLM features are disabled when LLM_API_KEY
//   is not set, allowing the platform to run without an LLM key):
//
//     LLM_PROVIDER          openai | anthropic | gemini        (default: openai)
//     LLM_API_KEY           API key for the primary provider
//     LLM_MODEL             Model identifier                   (default: gpt-4o-mini)
//     LLM_BASE_URL          Override the OpenAI-compatible base URL (optional)
//                           Use https://models.inference.ai.azure.com for GitHub Models
//     LLM_FALLBACK_PROVIDER openai | anthropic | gemini        (optional)
//     LLM_FALLBACK_API_KEY  API key for the fallback provider  (optional)
//     LLM_FALLBACK_MODEL    Model for the fallback provider    (optional)
//     LLM_FALLBACK_BASE_URL Override the fallback OpenAI-compatible base URL (optional)
//
//   Security:
//     • API keys are never logged
//     • All requests are aborted after LLM_TIMEOUT_MS (default: 15 000)
//     • Responses are validated before being returned
//     • Base URL overrides are validated to be https:// to prevent SSRF
// ─────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 15_000;

// Provider base URLs — never user-controlled
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Validate and normalise a user-supplied base URL override.
 * Rejects anything that is not a plain https:// URL to prevent SSRF.
 */
function sanitiseBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  if (!trimmed.startsWith('https://')) {
    throw new Error(`LLM_BASE_URL must start with https:// (got: ${trimmed.slice(0, 40)})`);
  }
  return trimmed;
}

function geminiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

/** Extract system message and remaining user/assistant messages from message list. */
function splitMessages(messages: LlmMessage[]): { system: string; turns: LlmMessage[] } {
  const system = messages.find((m) => m.role === 'system')?.content ?? '';
  const turns = messages.filter((m) => m.role !== 'system');
  return { system, turns };
}

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);

  private readonly primary: {
    provider: LlmProvider;
    apiKey: string;
    model: string;
    baseUrl?: string;
  } | null;

  private readonly fallback: {
    provider: LlmProvider;
    apiKey: string;
    model: string;
    baseUrl?: string;
  } | null;

  constructor(config: ConfigService) {
    const primaryKey = config.get<string>('LLM_API_KEY') ?? '';
    if (primaryKey) {
      const rawBaseUrl = config.get<string>('LLM_BASE_URL') ?? '';
      let baseUrl: string | undefined;
      if (rawBaseUrl) {
        try {
          baseUrl = sanitiseBaseUrl(rawBaseUrl);
          this.logger.log(`LLM base URL override: ${baseUrl}`);
        } catch (e) {
          this.logger.error((e as Error).message + ' — ignoring LLM_BASE_URL');
        }
      }
      this.primary = {
        provider: (config.get<string>('LLM_PROVIDER') ?? 'openai') as LlmProvider,
        apiKey: primaryKey,
        model: config.get<string>('LLM_MODEL') ?? 'gpt-4o-mini',
        baseUrl,
      };
    } else {
      this.primary = null;
      this.logger.warn('LLM_API_KEY not set — LLM features disabled. Queries that escape keyword matching will fall back to a static help message.');
    }

    const fallbackKey = config.get<string>('LLM_FALLBACK_API_KEY') ?? '';
    if (fallbackKey) {
      const rawFallbackBaseUrl = config.get<string>('LLM_FALLBACK_BASE_URL') ?? '';
      let fallbackBaseUrl: string | undefined;
      if (rawFallbackBaseUrl) {
        try {
          fallbackBaseUrl = sanitiseBaseUrl(rawFallbackBaseUrl);
        } catch (e) {
          this.logger.error((e as Error).message + ' — ignoring LLM_FALLBACK_BASE_URL');
        }
      }
      this.fallback = {
        provider: (config.get<string>('LLM_FALLBACK_PROVIDER') ?? 'anthropic') as LlmProvider,
        apiKey: fallbackKey,
        model: config.get<string>('LLM_FALLBACK_MODEL') ?? 'claude-3-haiku-20240307',
        baseUrl: fallbackBaseUrl,
      };
    } else {
      this.fallback = null;
    }
  }

  /** True when at least one provider is configured. */
  get isEnabled(): boolean {
    return this.primary !== null;
  }

  /**
   * Send a completion request to the configured primary provider, with
   * automatic fallback to the secondary provider on failure.
   *
   * Returns null when no provider is configured or all providers fail.
   */
  async complete(
    messages: LlmMessage[],
    opts?: LlmCompletionOptions,
  ): Promise<LlmCompletion | null> {
    if (!this.primary) return null;

    try {
      return await this.dispatch(this.primary.provider, this.primary.apiKey, this.primary.model, messages, opts, this.primary.baseUrl);
    } catch (primaryErr) {
      this.logger.warn(`Primary LLM provider [${this.primary.provider}] failed: ${(primaryErr as Error).message}`);

      if (this.fallback) {
        try {
          return await this.dispatch(this.fallback.provider, this.fallback.apiKey, this.fallback.model, messages, opts, this.fallback.baseUrl);
        } catch (fallbackErr) {
          this.logger.error(`Fallback LLM provider [${this.fallback.provider}] also failed: ${(fallbackErr as Error).message}`);
        }
      }

      return null;
    }
  }

  // ── Provider dispatch ──────────────────────────────────────────────────────

  private dispatch(
    provider: LlmProvider,
    apiKey: string,
    model: string,
    messages: LlmMessage[],
    opts?: LlmCompletionOptions,
    baseUrl?: string,
  ): Promise<LlmCompletion> {
    switch (provider) {
      case 'openai':    return this.callOpenAI(apiKey, model, messages, opts, baseUrl);
      case 'anthropic': return this.callAnthropic(apiKey, model, messages, opts);
      case 'gemini':    return this.callGemini(apiKey, model, messages, opts);
    }
  }

  // ── OpenAI ─────────────────────────────────────────────────────────────────

  private async callOpenAI(
    apiKey: string,
    model: string,
    messages: LlmMessage[],
    opts?: LlmCompletionOptions,
    baseUrl?: string,
  ): Promise<LlmCompletion> {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: opts?.temperature ?? 0.3,
      max_tokens: opts?.maxTokens ?? 1024,
    };
    if (opts?.jsonMode) {
      body['response_format'] = { type: 'json_object' };
    }

    const url = baseUrl ? `${baseUrl}/chat/completions` : OPENAI_URL;
    const data = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    type OpenAIResponse = {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const res = data as OpenAIResponse;
    const content = res.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('OpenAI: unexpected response shape');

    return {
      content,
      provider: 'openai',
      model,
      promptTokens: res.usage?.prompt_tokens,
      completionTokens: res.usage?.completion_tokens,
    };
  }

  // ── Anthropic ──────────────────────────────────────────────────────────────

  private async callAnthropic(
    apiKey: string,
    model: string,
    messages: LlmMessage[],
    opts?: LlmCompletionOptions,
  ): Promise<LlmCompletion> {
    const { system, turns } = splitMessages(messages);

    // Anthropic expects strictly alternating user/assistant turns
    const anthropicMessages = turns.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const systemPrompt = opts?.jsonMode
      ? `${system}\n\nIMPORTANT: Your entire response must be a single valid JSON object. Do not include any text outside the JSON.`
      : system;

    const body: Record<string, unknown> = {
      model,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.3,
      messages: anthropicMessages,
    };
    if (systemPrompt) body['system'] = systemPrompt;

    const data = await this.fetchWithTimeout(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    type AnthropicResponse = {
      content: Array<{ type: string; text: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const res = data as AnthropicResponse;
    const content = res.content?.find((c) => c.type === 'text')?.text;
    if (typeof content !== 'string') throw new Error('Anthropic: unexpected response shape');

    return {
      content,
      provider: 'anthropic',
      model,
      promptTokens: res.usage?.input_tokens,
      completionTokens: res.usage?.output_tokens,
    };
  }

  // ── Google Gemini ──────────────────────────────────────────────────────────

  private async callGemini(
    apiKey: string,
    model: string,
    messages: LlmMessage[],
    opts?: LlmCompletionOptions,
  ): Promise<LlmCompletion> {
    const { system, turns } = splitMessages(messages);

    const systemInstruction = opts?.jsonMode
      ? `${system}\n\nIMPORTANT: Respond with a single valid JSON object only.`
      : system;

    // Gemini roles are 'user' | 'model'
    const contents = turns.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: opts?.temperature ?? 0.3,
        maxOutputTokens: opts?.maxTokens ?? 1024,
      },
    };
    if (systemInstruction) {
      body['systemInstruction'] = { parts: [{ text: systemInstruction }] };
    }

    // apiKey is passed as query param for Gemini — use encodeURIComponent to prevent injection
    const url = `${geminiUrl(model)}?key=${encodeURIComponent(apiKey)}`;

    const data = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    type GeminiResponse = {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const res = data as GeminiResponse;
    const content = res.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== 'string') throw new Error('Gemini: unexpected response shape');

    return {
      content,
      provider: 'gemini',
      model,
      promptTokens: res.usageMetadata?.promptTokenCount,
      completionTokens: res.usageMetadata?.candidatesTokenCount,
    };
  }

  // ── HTTP helper ────────────────────────────────────────────────────────────

  private async fetchWithTimeout(
    url: string,
    init: RequestInit,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timerId);
    }

    if (!response.ok) {
      let detail = '';
      try {
        const errBody = (await response.json()) as Record<string, unknown>;
        // Extract error message without leaking full response to logs
        detail = String((errBody['error'] as Record<string, unknown>)?.['message'] ?? response.statusText);
      } catch {
        detail = response.statusText;
      }
      throw new Error(`HTTP ${response.status}: ${detail}`);
    }

    return response.json() as unknown;
  }
}
