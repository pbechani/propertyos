import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmGatewayService } from './llm-gateway.service';

// ─────────────────────────────────────────────────────────────────────────────
// LlmGatewayService unit tests
//
// These tests exercise:
//   1. Constructor config reading (primary, fallback, base URL wiring)
//   2. isEnabled flag
//   3. LLM_BASE_URL / LLM_FALLBACK_BASE_URL — happy path + SSRF guard
//   4. complete() routing to the correct provider URL
//   5. Fallback on primary failure
//   6. Returns null when no provider is configured
// ─────────────────────────────────────────────────────────────────────────────

/** Build a ConfigService stub that returns values from a plain map. */
function buildConfig(map: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string) => map[key] ?? undefined),
  } as unknown as ConfigService;
}

/** Stub a successful fetch response with a given JSON body. */
function stubFetch(body: unknown): jest.SpyInstance {
  return jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => body,
  } as unknown as Response);
}

/** Stub a fetch that rejects (network error). */
function stubFetchError(message = 'Network error'): jest.SpyInstance {
  return jest.spyOn(global, 'fetch').mockRejectedValue(new Error(message));
}

/** Stub fetch to fail once, then succeed with body. */
function stubFetchFailThenSucceed(successBody: unknown): jest.SpyInstance {
  return jest
    .spyOn(global, 'fetch')
    .mockRejectedValueOnce(new Error('Primary network error'))
    .mockResolvedValue({
      ok: true,
      json: async () => successBody,
    } as unknown as Response);
}

const OPENAI_RESPONSE = {
  choices: [{ message: { content: 'Hello from OpenAI' } }],
  usage: { prompt_tokens: 10, completion_tokens: 5 },
};

const ANTHROPIC_RESPONSE = {
  content: [{ type: 'text', text: 'Hello from Anthropic' }],
  usage: { input_tokens: 12, output_tokens: 6 },
};

const MESSAGES = [{ role: 'user' as const, content: 'Hello' }];

// ─ helpers ──────────────────────────────────────────────────────────────────

async function buildService(env: Record<string, string>): Promise<LlmGatewayService> {
  const module = await Test.createTestingModule({
    providers: [
      LlmGatewayService,
      { provide: ConfigService, useValue: buildConfig(env) },
    ],
  }).compile();
  return module.get(LlmGatewayService);
}

// ─────────────────────────────────────────────────────────────────────────────

afterEach(() => jest.restoreAllMocks());

// ── isEnabled ────────────────────────────────────────────────────────────────

describe('isEnabled', () => {
  it('returns false when LLM_API_KEY is not set', async () => {
    const svc = await buildService({});
    expect(svc.isEnabled).toBe(false);
  });

  it('returns true when LLM_API_KEY is set', async () => {
    const svc = await buildService({ LLM_API_KEY: 'sk-test' });
    expect(svc.isEnabled).toBe(true);
  });
});

// ── complete() with default OpenAI URL ───────────────────────────────────────

describe('complete() — openai provider (default URL)', () => {
  it('calls the default OpenAI endpoint and returns completion', async () => {
    const fetchSpy = stubFetch(OPENAI_RESPONSE);
    const svc = await buildService({ LLM_API_KEY: 'sk-openai', LLM_PROVIDER: 'openai' });

    const result = await svc.complete(MESSAGES);

    expect(result).not.toBeNull();
    expect(result!.content).toBe('Hello from OpenAI');
    expect(result!.provider).toBe('openai');

    const calledUrl = (fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl).toBe('https://api.openai.com/v1/chat/completions');
  });
});

// ── complete() with LLM_BASE_URL (GitHub Models) ─────────────────────────────

describe('complete() — LLM_BASE_URL override', () => {
  it('uses the overridden base URL when LLM_BASE_URL is set', async () => {
    const fetchSpy = stubFetch(OPENAI_RESPONSE);
    const svc = await buildService({
      LLM_API_KEY: 'github_pat_test',
      LLM_PROVIDER: 'openai',
      LLM_BASE_URL: 'https://models.inference.ai.azure.com',
    });

    const result = await svc.complete(MESSAGES);

    expect(result).not.toBeNull();
    expect(result!.content).toBe('Hello from OpenAI');

    const calledUrl = (fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl).toBe('https://models.inference.ai.azure.com/chat/completions');
  });

  it('strips trailing slash from LLM_BASE_URL before appending path', async () => {
    const fetchSpy = stubFetch(OPENAI_RESPONSE);
    const svc = await buildService({
      LLM_API_KEY: 'github_pat_test',
      LLM_PROVIDER: 'openai',
      LLM_BASE_URL: 'https://models.inference.ai.azure.com/',
    });

    await svc.complete(MESSAGES);

    const calledUrl = (fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl).toBe('https://models.inference.ai.azure.com/chat/completions');
  });

  it('ignores LLM_BASE_URL and falls back to default URL when base URL is not https://', async () => {
    const fetchSpy = stubFetch(OPENAI_RESPONSE);
    const svc = await buildService({
      LLM_API_KEY: 'sk-openai',
      LLM_PROVIDER: 'openai',
      // SSRF attempt — must be rejected
      LLM_BASE_URL: 'http://internal-server.local',
    });

    await svc.complete(MESSAGES);

    const calledUrl = (fetchSpy.mock.calls[0][0] as string);
    expect(calledUrl).toBe('https://api.openai.com/v1/chat/completions');
  });
});

// ── complete() — returns null when no provider ───────────────────────────────

describe('complete() — no provider configured', () => {
  it('returns null immediately', async () => {
    const svc = await buildService({});
    const result = await svc.complete(MESSAGES);
    expect(result).toBeNull();
  });
});

// ── complete() — fallback on primary failure ─────────────────────────────────

describe('complete() — fallback provider', () => {
  it('uses fallback when primary fails', async () => {
    stubFetchFailThenSucceed(ANTHROPIC_RESPONSE);

    const svc = await buildService({
      LLM_API_KEY: 'sk-primary',
      LLM_PROVIDER: 'openai',
      LLM_FALLBACK_API_KEY: 'sk-ant-fallback',
      LLM_FALLBACK_PROVIDER: 'anthropic',
      LLM_FALLBACK_MODEL: 'claude-3-haiku-20240307',
    });

    const result = await svc.complete(MESSAGES);

    expect(result).not.toBeNull();
    expect(result!.content).toBe('Hello from Anthropic');
    expect(result!.provider).toBe('anthropic');
  });

  it('returns null when both primary and fallback fail', async () => {
    stubFetchError('Both providers down');

    const svc = await buildService({
      LLM_API_KEY: 'sk-primary',
      LLM_PROVIDER: 'openai',
      LLM_FALLBACK_API_KEY: 'sk-fallback',
      LLM_FALLBACK_PROVIDER: 'openai',
    });

    const result = await svc.complete(MESSAGES);
    expect(result).toBeNull();
  });

  it('uses LLM_FALLBACK_BASE_URL when fallback has a base URL override', async () => {
    const fetchSpy = stubFetchFailThenSucceed(OPENAI_RESPONSE);

    const svc = await buildService({
      LLM_API_KEY: 'sk-primary',
      LLM_PROVIDER: 'openai',
      LLM_FALLBACK_API_KEY: 'github_pat_fallback',
      LLM_FALLBACK_PROVIDER: 'openai',
      LLM_FALLBACK_MODEL: 'gpt-4o-mini',
      LLM_FALLBACK_BASE_URL: 'https://models.inference.ai.azure.com',
    });

    await svc.complete(MESSAGES);

    // Second call is the fallback
    const fallbackUrl = (fetchSpy.mock.calls[1][0] as string);
    expect(fallbackUrl).toBe('https://models.inference.ai.azure.com/chat/completions');
  });
});
