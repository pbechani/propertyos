// ─────────────────────────────────────────────────────────────────────────────
// LLM Gateway — shared types
// ─────────────────────────────────────────────────────────────────────────────

export type LlmProvider = 'openai' | 'anthropic' | 'gemini';

/** Normalised message format (superset of all provider formats). */
export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmCompletionOptions = {
  /** Maximum tokens in the completion (default: 1024). */
  maxTokens?: number;
  /**
   * Sampling temperature 0–1 (default: 0.3).
   * Lower = more deterministic, better for structured JSON output.
   */
  temperature?: number;
  /**
   * When true, instructs the provider to return a valid JSON object.
   * OpenAI: uses response_format.  Anthropic/Gemini: handled in system prompt.
   */
  jsonMode?: boolean;
};

export type LlmCompletion = {
  /** Raw text returned by the model. */
  content: string;
  /** Provider that served this completion. */
  provider: LlmProvider;
  /** Model identifier that was used. */
  model: string;
  /** Prompt tokens consumed (approximate — provider-dependent). */
  promptTokens?: number;
  /** Completion tokens consumed (approximate). */
  completionTokens?: number;
};
