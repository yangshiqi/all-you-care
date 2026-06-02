import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Anthropic SDK before importing llm.ts. vi.hoisted keeps the spy
// reachable from the hoisted vi.mock factory.
const { anthropicCreate } = vi.hoisted(() => ({ anthropicCreate: vi.fn() }));
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: anthropicCreate };
  },
}));

import { callLlm, LlmTruncatedError } from '../../src/lib/llm.js';

const log = { info() {}, warn() {}, error() {}, debug() {} } as never;

function geminiOk(finishReason: string, text: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] }, finishReason }],
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 480 },
    }),
    text: async () => text,
  };
}

function anthropicMsg(stopReason: string, text: string) {
  return {
    content: [{ type: 'text', text }],
    usage: { input_tokens: 1, output_tokens: 2 },
    stop_reason: stopReason,
  };
}

describe('callLlm chain fallback', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'g-test';
    process.env.ANTHROPIC_API_KEY = 'a-test';
    delete process.env.LLM_PROVIDER;
    anthropicCreate.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to anthropic when gemini truncates (MAX_TOKENS)', async () => {
    const fetchMock = vi.fn(async () => geminiOk('MAX_TOKENS', '{"src":"gemini-partial'));
    vi.stubGlobal('fetch', fetchMock);
    anthropicCreate.mockResolvedValue(anthropicMsg('end_turn', '{"src":"anthropic"}'));

    const res = await callLlm<{ src: string }>({
      prompt: 'x',
      expectJson: true,
      chain: [
        { provider: 'gemini', model: 'gemini-3.5-flash' },
        { provider: 'anthropic', model: 'claude-haiku-4-5' },
      ],
      log,
    });

    expect(res.provider).toBe('anthropic');
    expect(res.json).toEqual({ src: 'anthropic' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });

  it('disables gemini thinking via thinkingConfig.thinkingBudget=0', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init: { body: string }) => geminiOk('STOP', '{"ok":1}'),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await callLlm({
      prompt: 'x',
      expectJson: true,
      chain: [{ provider: 'gemini', model: 'gemini-3.5-flash' }],
      log,
    });

    expect(res.provider).toBe('gemini');
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingBudget: 0 });
  });

  it('surfaces truncation only after the whole chain is exhausted', async () => {
    const fetchMock = vi.fn(async () => geminiOk('MAX_TOKENS', '{"partial'));
    vi.stubGlobal('fetch', fetchMock);
    // anthropic also truncates -> callAnthropic throws LlmTruncatedError
    anthropicCreate.mockResolvedValue(anthropicMsg('max_tokens', '{"partial'));

    await expect(
      callLlm({
        prompt: 'x',
        expectJson: true,
        chain: [
          { provider: 'gemini', model: 'gemini-3.5-flash' },
          { provider: 'anthropic', model: 'claude-haiku-4-5' },
        ],
        log,
      }),
    ).rejects.toBeInstanceOf(LlmTruncatedError);
    expect(anthropicCreate).toHaveBeenCalledTimes(1);
  });
});
