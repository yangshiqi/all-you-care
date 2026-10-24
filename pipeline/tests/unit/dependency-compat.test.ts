import { afterEach, describe, expect, it, vi } from 'vitest';
import juice from 'juice';
import { callLlm } from '../../src/lib/llm.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('dependency compatibility', () => {
  it('keeps the Anthropic proxy request and response contract with the real SDK', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
    vi.stubEnv('ANTHROPIC_BASE_URL', 'https://proxy.example.test');
    let request: Request | undefined;
    const transport = vi.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      request = new Request(input, init);
      return new Response(JSON.stringify({
        id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-haiku-4-5',
        content: [{ type: 'text', text: '{"ok":true}' }],
        stop_reason: 'end_turn', stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 5 },
      }), { headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', transport);
    const result = await callLlm<{ ok: boolean }>({
      prompt: 'Summarize this item.', systemPrompt: 'Return JSON.',
      maxTokens: 128, temperature: 0, expectJson: true,
      chain: [{ provider: 'anthropic', model: 'claude-haiku-4-5' }],
      log: { info() {}, warn() {}, error() {}, debug() {} } as never,
    });
    expect(transport).toHaveBeenCalledTimes(1);
    expect(request?.url).toBe('https://proxy.example.test/v1/messages');
    expect(request?.headers.get('anthropic-version')).toBe('2023-06-01');
    expect(await request?.json()).toMatchObject({
      model: 'claude-haiku-4-5', max_tokens: 128, temperature: 0,
      system: 'Return JSON.', messages: [{ role: 'user', content: 'Summarize this item.' }],
    });
    expect(result).toMatchObject({
      json: { ok: true }, inputTokens: 10, outputTokens: 5,
      stopReason: 'end_turn', provider: 'anthropic',
    });
  });

  it('inlines newsletter CSS while preserving responsive rules and important styles', () => {
    const html = juice(`
      <style>
        .headline { color: #123456 !important; font-weight: bold; }
        @media (max-width: 600px) { .headline { font-size: 18px; } }
      </style>
      <table><tr><td class="headline">Weekly news</td></tr></table>
    `, { removeStyleTags: false, preserveImportant: true });
    expect(html).toMatch(/style="[^"]*color:\s*#123456\s*!important/);
    expect(html).toMatch(/style="[^"]*font-weight:\s*bold/);
    expect(html).toContain('@media');
    expect(html).toContain('Weekly news');
  });
});
