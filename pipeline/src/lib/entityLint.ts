// Deterministic post-LLM check for AI-company entity mix-ups (e.g. crediting
// Moonshot's Kimi to 阶跃星辰/StepFun). Warnings only — callers log, never fail.

export interface EntityLintWarning {
  kind: 'alias_mismatch' | 'misattribution';
  snippet: string;
  detail: string;
}

interface Company {
  key: string;
  zh: string[];
  en: string[];
  products?: RegExp;
}

// The confusable set: companies the LLM historically mixes up when translating
// English sources into Chinese. Product regexes identify the owner of a model
// name so we can spot "wrong company + someone else's product" sentences.
const COMPANIES: Company[] = [
  { key: 'moonshot', zh: ['月之暗面'], en: ['Moonshot AI', 'MoonshotAI', 'Moonshot'], products: /Kimi/i },
  { key: 'stepfun', zh: ['阶跃星辰'], en: ['StepFun', 'Step Fun'], products: /\bStep[-\s]?\d/ },
  { key: 'zhipu', zh: ['智谱'], en: ['Zhipu AI', 'ZhipuAI', 'Zhipu', 'Z.ai'], products: /GLM/ },
  { key: 'deepseek', zh: ['深度求索'], en: ['DeepSeek'], products: /DeepSeek/i },
  { key: '01ai', zh: ['零一万物'], en: ['01.AI', '01 AI', '01.ai'], products: /\bYi-\w/ },
  { key: 'modelbest', zh: ['面壁智能', '面壁'], en: ['ModelBest', 'OpenBMB'], products: /MiniCPM/i },
  { key: 'baichuan', zh: ['百川智能', '百川'], en: ['Baichuan'], products: /Baichuan[-\s]?\d/i },
  { key: 'minimax', zh: ['稀宇科技'], en: ['MiniMax'], products: /海螺|abab/ },
  { key: 'alibaba', zh: ['阿里巴巴', '阿里云', '阿里'], en: ['Alibaba', 'Aliyun'], products: /Qwen|通义|千问/i },
  { key: 'bytedance', zh: ['字节跳动', '字节'], en: ['ByteDance'], products: /豆包|Doubao|Seedance|Seedream/i },
  { key: 'tencent', zh: ['腾讯'], en: ['Tencent'], products: /混元|Hunyuan/i },
];

const ATTRIBUTION_RE = /发布|推出|开源|上线|旗下|出品|自研|打造|研发|宣布|名为/;
// Non-ownership relations (investment, integration, comparison) legitimately
// put another company next to a product — skip those sentences.
const NON_OWNERSHIP_RE = /投资|收购|入股|领投|参投|合作|接入|集成|支持|兼容|采用|适配|对比|对标|超越|超过|击败|评测|竞品/;

function findByEn(name: string): Company | undefined {
  const n = name.trim().toLowerCase();
  return COMPANIES.find(c => c.en.some(e => e.toLowerCase() === n));
}

function companiesIn(text: string): Company[] {
  const lower = text.toLowerCase();
  return COMPANIES.filter(c =>
    c.zh.some(z => text.includes(z)) || c.en.some(e => lower.includes(e.toLowerCase())),
  );
}

// `中文名（English Name）` pairs: if the English half is a known company, the
// Chinese half must end with one of its known zh names.
function lintAliasPairs(text: string): EntityLintWarning[] {
  const warnings: EntityLintWarning[] = [];
  const re = /([一-龥][一-龥A-Za-z0-9·]{1,11})[（(]([A-Za-z0-9][A-Za-z0-9 .\-]{1,29})[）)]/g;
  for (const m of text.matchAll(re)) {
    const [full, zhName, enName] = m as unknown as [string, string, string];
    const enCompany = findByEn(enName);
    if (!enCompany) continue;
    if (!enCompany.zh.some(z => zhName.endsWith(z))) {
      warnings.push({
        kind: 'alias_mismatch',
        snippet: full,
        detail: `“${enName}” 的中文名应为 ${enCompany.zh[0]}，而不是 “${zhName}”`,
      });
    }
  }
  return warnings;
}

// Sentence-level: company A + attribution verb + company B's product, with A's
// own products absent and B unmentioned → A is likely wrongly credited.
function lintAttribution(text: string): EntityLintWarning[] {
  const warnings: EntityLintWarning[] = [];
  for (const raw of text.split(/[。！？!?；;\n]/)) {
    const sentence = raw.trim();
    if (!sentence || !ATTRIBUTION_RE.test(sentence) || NON_OWNERSHIP_RE.test(sentence)) continue;
    const mentioned = companiesIn(sentence);
    if (mentioned.length === 0) continue;
    const orphanOwners = COMPANIES.filter(c =>
      c.products?.test(sentence) && !mentioned.some(m => m.key === c.key),
    );
    for (const owner of orphanOwners) {
      for (const candidate of mentioned) {
        if (candidate.products?.test(sentence)) continue;
        warnings.push({
          kind: 'misattribution',
          snippet: sentence.slice(0, 80),
          detail: `句中产品应属 ${owner.zh[0]}（${owner.en[0]}），但归属指向了 ${candidate.zh[0] ?? candidate.en[0]}`,
        });
      }
    }
  }
  return warnings;
}

export function lintEntityBindings(text: string): EntityLintWarning[] {
  return [...lintAliasPairs(text), ...lintAttribution(text)];
}
