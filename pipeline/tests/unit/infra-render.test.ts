import { describe, it, expect } from 'vitest';
import { renderInfraContent, parseInfraPayload } from '../../src/steps/infraRender.js';
import type { InfraWeeklyPayload } from '../../src/lib/infraTypes.js';

const payload: InfraWeeklyPayload = {
  title: '[云原生周报] 6月30日当周：DRA 成主线',
  week_label: '6月30日当周',
  headline: 'DRA 成主线',
  overview: '本周控制面继续补短板。',
  summary: 's',
  tags: ['Kubernetes', 'DRA'],
  categories: [
    { key: 'k8s', label: 'Kubernetes 与容器编排', empty_note: null, items: [
      { title: 'Kueue v0.18.2', what: '修复 DRA', problem: 'p', value: 'v', scenarios: 'sc',
        pitfalls: '升级前清理 hook', score: 8.2, kind: '实时',
        sources: [{ label: 'Kueue v0.18.2 Release', url: 'https://github.com/x/y' }] },
    ] },
    { key: 'mesh_obs', label: 'Service Mesh 与云原生可观测', empty_note: '本周窗口内无可核验重大更新。', items: [] },
    { key: 'serverless_storage', label: 'Serverless、存储与中间件', empty_note: '本周窗口内无可核验重大更新。', items: [] },
    { key: 'ai_native', label: '云原生 × AI 融合与开源项目', empty_note: '本周窗口内无可核验重大更新。', items: [] },
    { key: 'vendor', label: '厂商产品更新', empty_note: '本周窗口内无可核验重大更新。', items: [] },
  ],
  trends: ['异构调度走向声明式需求'],
  recommendations: [{ audience: '训练平台', text: '先验证 Kueue v0.18.2' }],
};

describe('renderInfraContent', () => {
  const html = renderInfraContent(payload);
  it('renders overview and all 5 section labels', () => {
    expect(html).toContain('本周控制面继续补短板。');
    for (const label of ['Kubernetes 与容器编排', 'Service Mesh 与云原生可观测', 'Serverless、存储与中间件', '云原生 × AI 融合与开源项目', '厂商产品更新'])
      expect(html).toContain(label);
  });
  it('renders the 5 per-item fields with labels', () => {
    for (const label of ['是什么', '解决什么问题', '落地价值', '适用场景', '踩坑提醒'])
      expect(html).toContain(label);
    expect(html).toContain('升级前清理 hook');
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
    p2.categories[0]!.items[0]!.what = '<script>alert(1)</script>';
    expect(renderInfraContent(p2)).not.toContain('<script>alert(1)</script>');
  });
});

describe('parseInfraPayload', () => {
  it('parses valid JSON', () => expect(parseInfraPayload(JSON.stringify(payload))?.headline).toBe('DRA 成主线'));
  it('returns null on bad JSON', () => expect(parseInfraPayload('nope')).toBeNull());
});
