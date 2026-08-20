import { describe, it, expect } from 'vitest';
import {
  parseScoredEvents,
  normalizeTitle,
  deduplicateEvents,
} from '../../src/lib/eventDedup.js';

describe('parseScoredEvents', () => {
  it('parses a typical scored block with 3 events', () => {
    const md = `Some preamble that should be ignored.

#### DeepSeek 完成 8 亿美元融资
**原文**: DeepSeek 宣布完成新一轮融资，估值达 800 亿美元。
**链接**: [查看详情](https://example.com/a) | [报道](https://example.com/a-bis)
**热度**: ⭐ 8.8/10

#### Anthropic 任命新 CFO
**原文**: Anthropic 招募前 Stripe 高管出任首席财务官。
**链接**: [TechCrunch](https://techcrunch.com/anthropic-cfo)
**热度**: ⭐ 7.2/10

#### Cerebras 提交 IPO 文件
**原文**: AI 芯片公司 Cerebras 正式提交 S-1。
**链接**: [WSJ](https://wsj.com/cerebras)
**热度**: ⭐ 8.5/10
`;
    const evts = parseScoredEvents(md);
    expect(evts).toHaveLength(3);
    expect(evts[0]).toEqual({
      title: 'DeepSeek 完成 8 亿美元融资',
      description: 'DeepSeek 宣布完成新一轮融资，估值达 800 亿美元。',
      links: ['https://example.com/a', 'https://example.com/a-bis'],
      score: 8.8,
    });
    expect(evts[1]?.title).toBe('Anthropic 任命新 CFO');
    expect(evts[1]?.score).toBe(7.2);
    expect(evts[2]?.links).toEqual(['https://wsj.com/cerebras']);
  });

  it('falls back to defaults when 链接 / 热度 are missing', () => {
    const md = `#### 仅有标题与描述的事件
**原文**: 一段描述。
`;
    const evts = parseScoredEvents(md);
    expect(evts).toHaveLength(1);
    expect(evts[0]).toEqual({
      title: '仅有标题与描述的事件',
      description: '一段描述。',
      links: [],
      score: 0,
    });
  });

  it('handles only a heading (no markers, no body)', () => {
    const md = `#### 一个孤独的标题`;
    const evts = parseScoredEvents(md);
    expect(evts).toHaveLength(1);
    expect(evts[0]?.title).toBe('一个孤独的标题');
    expect(evts[0]?.description).toBe('');
    expect(evts[0]?.links).toEqual([]);
    expect(evts[0]?.score).toBe(0);
  });

  it('extracts multiple URLs from a 链接 line with `|` separators', () => {
    const md = `#### Multi-link
**链接**: [a](https://a.example) | [b](https://b.example) | [c](https://c.example)
**热度**: ⭐ 6.5/10
`;
    const evts = parseScoredEvents(md);
    expect(evts[0]?.links).toEqual([
      'https://a.example',
      'https://b.example',
      'https://c.example',
    ]);
    expect(evts[0]?.score).toBe(6.5);
  });

  it('discards 点评 lines (legacy scoring output) instead of leaking into description', () => {
    const md = `#### 某事件
**原文**: 一段事件描述。
**链接**: [src](https://x.example)
**热度**: ⭐ 7.5/10
**点评**: 这是不该出现在 description 里的旧字段。
`;
    const evts = parseScoredEvents(md);
    expect(evts).toHaveLength(1);
    expect(evts[0]?.description).toBe('一段事件描述。');
    expect(evts[0]?.description).not.toContain('点评');
    expect(evts[0]?.description).not.toContain('不该出现');
  });
});

describe('normalizeTitle', () => {
  it('strips a (总结/回顾) suffix', () => {
    expect(normalizeTitle('OpenAI 发布会回顾（总结/回顾）'))
      .toBe('openai 发布会回顾');
    expect(normalizeTitle('某事件（总结）')).toBe('某事件');
    expect(normalizeTitle('某事件（回顾）')).toBe('某事件');
  });

  it('lowercases ASCII while keeping CJK as-is', () => {
    expect(normalizeTitle('NVIDIA 发布 Blackwell GPU'))
      .toBe('nvidia 发布 blackwell gpu');
  });

  it('collapses whitespace and trims', () => {
    expect(normalizeTitle('  Hello   World  '))
      .toBe('hello world');
  });

  it('strips leading numeric enumeration', () => {
    expect(normalizeTitle('1. Foo')).toBe('foo');
    expect(normalizeTitle('2、Bar')).toBe('bar');
  });
});

describe('deduplicateEvents', () => {
  it('merges events with the same normalised title, keeping max score', () => {
    const out = deduplicateEvents([
      {
        title: 'OpenAI launches GPT-6',
        description: 'short',
        links: ['https://a.example'],
        score: 8.0,
      },
      {
        title: 'openai launches gpt-6',
        description: 'a longer, more detailed description',
        links: ['https://b.example'],
        score: 9.0,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe(1);
    expect(out[0]?.score).toBe(9.0);
    expect(out[0]?.description).toBe('a longer, more detailed description');
    expect(out[0]?.links.sort()).toEqual([
      'https://a.example',
      'https://b.example',
    ]);
    expect(out[0]?.source_count).toBe(2);
  });

  // A shared URL is corroborating evidence, not identity — see the digest /
  // roundup cases below. It merges when title or description similarity backs
  // it up, which is the shape real `**原文**` blocks always have.
  it('merges events with different titles when a shared URL is corroborated', () => {
    const out = deduplicateEvents([
      {
        title: 'DeepSeek raises 800M',
        description: 'DeepSeek 宣布完成新一轮 8 亿美元融资，投后估值达到 800 亿美元，本轮由多家国有基金联合领投，资金将用于扩充算力储备。',
        links: ['https://news.example/deepseek'],
        score: 7.5,
      },
      {
        title: 'DeepSeek 完成 8 亿美元融资',
        description: 'DeepSeek 完成新一轮融资，规模为 8 亿美元，投后估值达 800 亿美元，由多家国有基金领投，募集资金主要投向算力储备扩充。',
        links: ['https://news.example/deepseek'],
        score: 8.8,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.score).toBe(8.8);
    expect(out[0]?.source_count).toBe(2);
    expect(out[0]?.links).toEqual(['https://news.example/deepseek']);
  });

  it('keeps unrelated events separate and assigns sequential ids', () => {
    const out = deduplicateEvents([
      { title: 'A', description: 'a', links: ['https://x.example/a'], score: 7 },
      { title: 'B', description: 'b', links: ['https://x.example/b'], score: 6 },
      { title: 'C', description: 'c', links: [], score: 5 },
    ]);
    expect(out).toHaveLength(3);
    expect(out.map(e => e.id)).toEqual([1, 2, 3]);
    expect(out.map(e => e.title)).toEqual(['A', 'B', 'C']);
  });

  it('treats summary/回顾 suffix as the same event', () => {
    const out = deduplicateEvents([
      { title: 'AI 早报 周报', description: 'orig', links: [], score: 6 },
      { title: 'AI 早报 周报（总结/回顾）', description: 'review', links: [], score: 7 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.score).toBe(7);
    expect(out[0]?.source_count).toBe(2);
  });

  it('preserves the union of links across duplicates', () => {
    const out = deduplicateEvents([
      { title: 'X', description: '', links: ['https://1.example'], score: 5 },
      { title: 'X', description: '', links: ['https://2.example'], score: 5 },
      { title: 'X', description: '', links: ['https://1.example', 'https://3.example'], score: 5 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.links.sort()).toEqual([
      'https://1.example',
      'https://2.example',
      'https://3.example',
    ]);
    expect(out[0]?.source_count).toBe(3);
  });

  it('does not collapse two unrelated events that happen to share zero links', () => {
    const out = deduplicateEvents([
      { title: 'Apple ships M5', description: '', links: [], score: 7 },
      { title: 'Google ships TPU v6', description: '', links: [], score: 7 },
    ]);
    expect(out).toHaveLength(2);
  });

  // ── fuzzy title matching (Chinese near-duplicates) ──────────────────────

  it('fuzzy-merges Chinese titles with high char overlap + identical latin tokens', () => {
    const out = deduplicateEvents([
      {
        title: '美中讨论最强大 AI 模型防护栏',
        description: 'wording A',
        links: ['https://a.example'],
        score: 9.0,
      },
      {
        title: '中美讨论强大 AI 模型安全护栏',
        description: 'wording B',
        links: ['https://b.example'],
        score: 8.7,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.score).toBe(9.0);
    expect(out[0]?.source_count).toBe(2);
  });

  it('does NOT fuzzy-merge GPT-5 vs GPT-6 (digit differs in latin token)', () => {
    const out = deduplicateEvents([
      { title: 'OpenAI 发布 GPT-5', description: '', links: [], score: 9 },
      { title: 'OpenAI 发布 GPT-6', description: '', links: [], score: 9 },
    ]);
    expect(out).toHaveLength(2);
  });

  it('does NOT fuzzy-merge Llama 3 vs Llama 4', () => {
    const out = deduplicateEvents([
      { title: 'Meta 发布 Llama 3', description: '', links: [], score: 8 },
      { title: 'Meta 发布 Llama 4', description: '', links: [], score: 8 },
    ]);
    expect(out).toHaveLength(2);
  });

  it('does NOT fuzzy-merge iPhone 17 Pro vs iPhone 17 Pro Max (different SKU)', () => {
    const out = deduplicateEvents([
      { title: 'Apple 发布 iPhone 17 Pro', description: '', links: [], score: 7 },
      { title: 'Apple 发布 iPhone 17 Pro Max', description: '', links: [], score: 7 },
    ]);
    expect(out).toHaveLength(2);
  });

  it('fuzzy-merges Chinese paraphrases with no latin tokens', () => {
    const out = deduplicateEvents([
      { title: '字节跳动发布豆包大模型', description: '', links: [], score: 7 },
      { title: '字节跳动推出豆包大模型', description: '', links: [], score: 7 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.source_count).toBe(2);
  });

  it('does NOT fuzzy-merge when CJK overlap is too low', () => {
    // Same entity but very different framing — Jaccard below threshold.
    const out = deduplicateEvents([
      { title: '美国批准中国企业购买英伟达 H200 AI 芯片', description: '', links: [], score: 9 },
      { title: '英伟达寻求 H200 出口许可，押注重返中国 AI 芯片市场', description: '', links: [], score: 9 },
    ]);
    // Conservative — these stay separate (would need semantic / cross-link
    // dedup to catch). Documented limitation.
    expect(out).toHaveLength(2);
  });

  // ── description-similarity fallback ─────────────────────────────────────

  it('merges cross-source paraphrases via description fallback (Brockman case)', () => {
    const out = deduplicateEvents([
      {
        title: 'OpenAI 重组高管团队：Greg Brockman 接管产品战略，ChatGPT/Codex/API 整合为核心产品团队',
        description: 'Greg Brockman 全面负责产品战略，同时主管 AI 基础设施，旗下 ChatGPT、Codex、API 整合至同一产品团队，统一产品线管理。',
        links: ['https://a.example/brockman-1'],
        score: 8.2,
      },
      {
        title: 'OpenAI 联合创始人 Greg Brockman 接管产品战略，ChatGPT 或与 Codex 合并',
        description: 'Greg Brockman 重新出山主导 OpenAI 产品战略，公司同步计划整合 ChatGPT 与 Codex 编程产品，是近期内部架构调整的重要组成部分。',
        links: ['https://b.example/brockman-2'],
        score: 8.2,
      },
      {
        title: 'OpenAI联合创始人布罗克曼正式接管产品战略，计划整合ChatGPT与Codex',
        description: 'OpenAI总裁格雷格·布罗克曼正式接手产品战略统筹，计划将ChatGPT与代码工具Codex整合为一体化体验，此前因CEO菲吉·西莫病假临时代管。',
        links: ['https://c.example/brockman-3'],
        score: 8.2,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.source_count).toBe(3);
    // All three "view details" links preserved
    expect(out[0]?.links).toEqual([
      'https://a.example/brockman-1',
      'https://b.example/brockman-2',
      'https://c.example/brockman-3',
    ]);
  });

  it('does NOT merge two unrelated OpenAI stories via description fallback', () => {
    const out = deduplicateEvents([
      {
        title: 'OpenAI 联合创始人 Greg Brockman 接管产品战略',
        description: 'Greg Brockman 重新出山主导 OpenAI 产品战略，公司同步计划整合 ChatGPT 与 Codex 编程产品。',
        links: ['https://a.example/p'],
        score: 8.0,
      },
      {
        title: 'OpenAI 发布 Sora 2 视频模型',
        description: 'OpenAI 正式上线下一代视频生成模型 Sora 2，支持 1080p 输出与连续镜头，面向 Plus 与 Pro 订阅用户开放。',
        links: ['https://b.example/q'],
        score: 8.0,
      },
    ]);
    // Only "openai" is shared — below the 3-token entity-anchor threshold.
    expect(out).toHaveLength(2);
  });

  it('does NOT merge via description fallback when descriptions are too short', () => {
    const out = deduplicateEvents([
      {
        title: 'OpenAI 发布新版 ChatGPT API',
        description: '简短一句话。', // < 30 chars, fallback should be skipped
        links: ['https://a.example/x'],
        score: 7,
      },
      {
        title: 'OpenAI ChatGPT API 更新',
        description: 'OpenAI ChatGPT API 新版上线。', // < 30 chars
        links: ['https://b.example/y'],
        score: 7,
      },
    ]);
    expect(out).toHaveLength(2);
  });

  it('merges DeepSeek pricing variants via description fallback (bare numbers are not versions)', () => {
    const out = deduplicateEvents([
      {
        title: 'DeepSeek 永久化 75% 折扣，输出 token 价格 $0.87/M',
        description: 'DeepSeek 宣布永久下调 API 价格至原价 25%，V4-Pro 模型输出 token 价格降至 $0.87/M，输入价格同步大幅下调。',
        links: ['https://a.example/ds-price-1'],
        score: 7.5,
      },
      {
        title: 'DeepSeek-V4-Pro API永久降价至原价25%',
        description: 'DeepSeek 正式宣布旗舰模型 V4-Pro 的 API 价格永久降至原价的 25%，大幅降低开发者使用成本，输出 token 仅 $0.87/M。',
        links: ['https://b.example/ds-price-2'],
        score: 7.5,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.source_count).toBe(2);
  });

  it('description fallback still allows GPT-5 vs GPT-6 to stay separate', () => {
    // Even with similar long descriptions, version differentiation in titles
    // means these stay as separate model announcements (token "gpt-5" vs
    // "gpt-6" are unique anchors, fall below shared-token threshold).
    const out = deduplicateEvents([
      {
        title: 'OpenAI 发布 GPT-5',
        description: 'OpenAI 正式发布旗下下一代大模型，性能在数学、编码、推理等基准上较前代有明显提升，面向 Plus / Pro 用户先行开放。',
        links: ['https://a.example/g5'],
        score: 9,
      },
      {
        title: 'OpenAI 发布 GPT-6',
        description: 'OpenAI 正式发布旗下下一代大模型，性能在数学、编码、推理等基准上较前代有明显提升，面向 Plus / Pro 用户先行开放。',
        links: ['https://b.example/g6'],
        score: 9,
      },
    ]);
    expect(out).toHaveLength(2);
  });
  // ── digest / roundup articles ───────────────────────────────────────────
  //
  // Regression: issue 135 (2026-08-20). A 极客早知道 daily roundup
  // (geekpark.net/news/368995) is compressed into a dozen separate news items
  // that all carry the roundup's link. URL-as-identity let the first bucket
  // holding that link swallow all of them, shipping a card titled "OpenAI
  // 第二季度营收增速放缓" whose body described a HoverAir drone camera.

  it('does not merge unrelated stories that share a digest/roundup URL', () => {
    const DIGEST = 'http://www.geekpark.net/news/368995';
    const out = deduplicateEvents([
      {
        title: 'Anthropic 第二季度营收达 116 亿美元，首次超越 OpenAI',
        description: 'Anthropic 在 2026 年第二季度的营收增长了一倍多，达到 116 亿美元，营收规模首次超过竞争对手 OpenAI，并实现了小幅营业盈利。',
        links: [DIGEST],
        score: 9.5,
      },
      {
        title: '苹果 macOS 代码曝光带摄像头的 AirPods，支持“视觉智能”',
        description: '在苹果最新发布的 macOS Tahoe 26.7 RC 版本中，发现了代号为 B790 的带摄像头 AirPods 演示视频，最快有望于今年 9 月发布。',
        links: [DIGEST],
        score: 8.5,
      },
      {
        title: '哈浮发布 VERSA 飞行口袋云台相机，售价 2999 元起',
        description: '智能飞行影像品牌哈浮（HoverAir）发布 VERSA 飞行口袋云台相机，首发价 2999 元起。该设备采用模块化设计，重量在 250 克以内，内置 4nm 旗舰 AI 芯片。',
        links: [DIGEST],
        score: 6.5,
      },
    ]);
    expect(out).toHaveLength(3);
    expect(out.map(e => e.source_count)).toEqual([1, 1, 1]);
  });

  it('does not merge two unrelated stories that share a mis-attributed link', () => {
    // compress occasionally hands a neighbouring item's link to an event. Two
    // events is below the roundup threshold, so similarity has to be the gate.
    const LINK = 'https://simonwillison.net/2026/Aug/18/mojo-is-now-open-source/';
    const out = deduplicateEvents([
      {
        title: '编程语言 Mojo 正式开源，采用 Apache 2.0 许可证',
        description: '旨在简化 GPU 编程的 Mojo 编程语言在发布 1.0 版本后，正式将其编译器和工具链开源，托管于 Apache 2 许可证下。目前 Mojo 已演变为一门独立的语言。',
        links: [LINK],
        score: 8.2,
      },
      {
        title: '企业 AI 平台 Glean 披露财务数据，ARR 达 3 亿美元',
        description: '由前 Google 杰出工程师 Arvind Jain 联合创办的企业 AI 平台 Glean 宣布其年经常性收入（ARR）已达到 3 亿美元，在 15 个月内实现了 3 倍增长。',
        links: [LINK],
        score: 7.8,
      },
    ]);
    expect(out).toHaveLength(2);
  });

  it('does not mistake one article reported under three headlines for a digest', () => {
    // The container heuristic counts distinct *events*, not raw titles: three
    // paraphrases of one story collapse to one, so URL corroboration stays on
    // and they merge instead of shipping as three near-identical cards.
    const U = 'https://openai.com/index/new-model';
    const out = deduplicateEvents([
      {
        title: 'OpenAI 公布新一代 GPT 模型路线图',
        description: 'OpenAI 今日公布全新的 GPT 模型路线图，强调推理能力和开发者工具升级，并将在未来几周逐步向用户开放。',
        links: [U],
        score: 8,
      },
      {
        title: '新模型即将上线：OpenAI 更新产品计划',
        description: 'OpenAI 更新了产品计划，新一代 GPT 将增强推理能力与开发工具，相关功能预计未来几周分阶段向用户推出。',
        links: [U],
        score: 8,
      },
      {
        title: 'GPT 迎来能力升级，开发工具同步改版',
        description: '新一代 GPT 将重点提升推理能力，OpenAI 也会同步改进开发工具，并计划在接下来的数周内陆续开放新功能。',
        links: [U],
        score: 8,
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]?.source_count).toBe(3);
  });

  // ── field provenance ────────────────────────────────────────────────────

  it('keeps title, description and score from the same source event', () => {
    const out = deduplicateEvents([
      {
        title: 'OpenAI 第二季度营收增速放缓',
        description: '据《华尔街日报》独家报道，OpenAI 在 2026 年第二季度的销售额增长呈现疲态，与竞争对手 Anthropic 强劲的增长势头相比，增速显得较为温和。',
        links: ['https://wsj.example/openai-q2'],
        score: 8.5,
      },
      {
        title: 'OpenAI Q2 营收增长放缓，不及 Anthropic',
        description: 'OpenAI 第二季度销售额增长乏力。据《华尔街日报》报道，其增速明显低于竞争对手 Anthropic，后者同期增长势头强劲，差距进一步拉开，引发投资人关注。',
        links: ['https://wsj.example/openai-q2'],
        score: 9.1,
      },
    ]);
    expect(out).toHaveLength(1);
    // The winning event contributes all three fields — never title from one
    // event and description from another.
    expect(out[0]?.score).toBe(9.1);
    expect(out[0]?.title).toBe('OpenAI Q2 营收增长放缓，不及 Anthropic');
    expect(out[0]?.description).toContain('后者同期增长势头强劲');
  });
});
