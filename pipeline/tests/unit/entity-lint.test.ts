import { describe, it, expect } from 'vitest';
import { lintEntityBindings } from '../../src/lib/entityLint.js';

describe('lintEntityBindings — alias_mismatch', () => {
  it('flags the real-world 阶跃星辰（Moonshot AI）bug', () => {
    const text = '阶跃星辰（Moonshot AI）推出了名为 Kimi K3 的开源权重模型。';
    const kinds = lintEntityBindings(text).map(w => w.kind);
    expect(kinds).toContain('alias_mismatch');
  });

  it('flags an invented translation for a known English name', () => {
    const warnings = lintEntityBindings('月影智能（Moonshot AI）发布新模型。');
    expect(warnings.some(w => w.kind === 'alias_mismatch')).toBe(true);
  });

  it('accepts the correct pair, including with a descriptive prefix', () => {
    expect(lintEntityBindings('月之暗面（Moonshot AI）发布 Kimi K3。')).toEqual([]);
    expect(lintEntityBindings('国内初创公司月之暗面（Moonshot AI）发布 Kimi K3。')).toEqual([]);
  });

  it('ignores parentheticals whose English half is not a known company', () => {
    expect(lintEntityBindings('混合专家（MoE）架构成为主流。')).toEqual([]);
    expect(lintEntityBindings('阶跃星辰（Step 3）跑分公开。')).toEqual([]);
  });

  it('handles digit-leading English aliases like 01.AI', () => {
    const warnings = lintEntityBindings('月之暗面（01.AI）发布 Yi-Large 2。');
    expect(warnings.some(w => w.kind === 'alias_mismatch')).toBe(true);
    expect(lintEntityBindings('零一万物（01.AI）发布 Yi-Large 2。')).toEqual([]);
  });

  it('accepts half-width parentheses', () => {
    const warnings = lintEntityBindings('阶跃星辰(Moonshot AI)推出 Kimi K3。');
    expect(warnings.some(w => w.kind === 'alias_mismatch')).toBe(true);
  });
});

describe('lintEntityBindings — misattribution', () => {
  it('flags the wrong company releasing someone else\'s product', () => {
    const text = '#### 阶跃星辰发布 2.8 万亿参数开源 MoE 模型 Kimi K3';
    const warnings = lintEntityBindings(text);
    expect(warnings.some(w => w.kind === 'misattribution')).toBe(true);
  });

  it('accepts the correct owner releasing its product', () => {
    expect(lintEntityBindings('月之暗面发布 2.8 万亿参数 MoE 模型 Kimi K3。')).toEqual([]);
  });

  it('accepts a company releasing its own product while comparing to another', () => {
    expect(lintEntityBindings('智谱发布 GLM-5，性能对标 Kimi K3。')).toEqual([]);
    expect(lintEntityBindings('DeepSeek 发布 V4，超越 Kimi K3。')).toEqual([]);
  });

  it('skips non-ownership relations (investment / integration)', () => {
    expect(lintEntityBindings('阿里巴巴宣布投资 Kimi 开发商。')).toEqual([]);
    expect(lintEntityBindings('腾讯云宣布接入 DeepSeek 与 Kimi 模型。')).toEqual([]);
  });

  it('stays silent when no tracked company appears', () => {
    expect(lintEntityBindings('传闻称 Kimi K3 即将开源。')).toEqual([]);
    expect(lintEntityBindings('OpenAI 发布 GPT-6，推理成本下降。')).toEqual([]);
  });

  it('handles multiple items and only flags the bad one', () => {
    const text = [
      '#### 月之暗面发布 Kimi K3',
      'Kimi K3 采用 MoE 架构。',
      '#### 百川智能推出名为 Kimi K3 Lite 的模型',
      '该模型参数量 70B。',
    ].join('\n');
    const warnings = lintEntityBindings(text);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.kind).toBe('misattribution');
    expect(warnings[0]!.snippet).toContain('百川智能');
  });
});
