import { describe, it, expect } from 'vitest';
import { renderInfraContent, parseInfraPayload } from '../../src/steps/infraRender.js';
import type { InfraWeeklyPayload } from '../../src/lib/infraTypes.js';

const payload: InfraWeeklyPayload = {
  title: '[AI 原生周报] 6月24日 - 6月30日：DRA 成主线',
  week_label: '6月24日 - 6月30日',
  headline: 'DRA 成主线',
  overview: '本周控制面继续补短板。',
  summary: 's',
  tags: ['Kubernetes', 'DRA'],
  categories: [
    { key: 'k8s', label: '容器与调度', empty_note: null, items: [
      { title: 'Kueue v0.18.2', maturity: '补丁修复', points: '修复 DRA', why: 'w', scenarios: 'sc',
        caveats: '升级前清理 hook', action: '预发验证后升级', score: 8.2,
        sources: [{ label: 'Kueue v0.18.2 Release', url: 'https://github.com/x/y' }] },
    ] },
    { key: 'mesh_obs', label: '可观测', empty_note: '本周窗口内无可核验重大更新。', items: [] },
    { key: 'serverless_storage', label: 'Serverless、存储与中间件', empty_note: '本周窗口内无可核验重大更新。', items: [] },
    { key: 'inference_engine', label: '推理引擎', empty_note: null, items: [
      { title: 'vLLM v0.24.0', maturity: 'RC', points: 'P/D 修复', why: 'w', scenarios: 'sc',
        caveats: 'rc 勿上生产', action: 'rc 勿上生产，仅测试验证', score: 8.0,
        sources: [{ label: 'vLLM v0.24.0 Release', url: 'https://github.com/vllm-project/vllm' }] },
    ] },
    { key: 'ai_native', label: '云原生 × AI 融合与开源项目', empty_note: '本周窗口内无可核验重大更新。', items: [] },
    { key: 'vendor', label: '厂商产品更新', empty_note: '本周窗口内无可核验重大更新。', items: [] },
  ],
  trends: ['异构调度走向声明式需求'],
  recommendations: [{ audience: '训练平台', text: '先验证 Kueue v0.18.2' }],
};

describe('renderInfraContent', () => {
  const html = renderInfraContent(payload);
  it('renders overview and all 6 section labels', () => {
    expect(html).toContain('本周控制面继续补短板。');
    for (const label of ['容器与调度', '可观测', 'Serverless、存储与中间件', '推理引擎', '云原生 × AI 融合与开源项目', '厂商产品更新'])
      expect(html).toContain(label);
  });
  it('renders the per-item fields + maturity tag with labels', () => {
    for (const label of ['要点', '为什么重要', '适用场景', '注意事项', '行动建议'])
      expect(html).toContain(label);
    expect(html).toContain('升级前清理 hook');   // caveats value
    expect(html).toContain('预发验证后升级');      // action value
    expect(html).toContain('补丁修复');            // maturity tag
  });
  it('renders empty_note for empty categories', () => {
    expect(html).toContain('本周窗口内无可核验重大更新。');
  });
  it('renders source links and trends/recommendations', () => {
    expect(html).toContain('https://github.com/x/y');
    expect(html).toContain('异构调度走向声明式需求');
    expect(html).toContain('训练平台');
  });
  it('escapes HTML in item text', () => {
    const p2 = structuredClone(payload);
    p2.categories[0]!.items[0]!.points = '<script>alert(1)</script>';
    expect(renderInfraContent(p2)).not.toContain('<script>alert(1)</script>');
  });
  it('drops non-http(s) source URLs (no javascript: href)', () => {
    const p = structuredClone(payload);
    p.categories[0]!.items[0]!.sources = [{ label: 'evil', url: 'javascript:alert(1)' }];
    const html = renderInfraContent(p);
    expect(html).not.toContain('javascript:alert(1)');
    expect(html).toContain('href="#"');
  });
});

describe('parseInfraPayload', () => {
  it('parses valid JSON', () => expect(parseInfraPayload(JSON.stringify(payload))?.headline).toBe('DRA 成主线'));
  it('returns null on bad JSON', () => expect(parseInfraPayload('nope')).toBeNull());
});
