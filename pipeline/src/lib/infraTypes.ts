// pipeline/src/lib/infraTypes.ts
// Contract shared by infraMerge (producer) and infraRender (consumer).

export type InfraCategoryKey =
  | 'k8s' | 'mesh_obs' | 'serverless_storage' | 'inference_engine' | 'ai_native';

export const INFRA_CATEGORY_ORDER: { key: InfraCategoryKey; label: string }[] = [
  { key: 'k8s',                label: '容器与调度' },
  { key: 'mesh_obs',           label: '可观测' },
  { key: 'serverless_storage', label: 'Serverless、存储与中间件' },
  { key: 'inference_engine',   label: '推理引擎' },
  { key: 'ai_native',          label: '云原生 × AI 融合与开源项目' },
];

const CATEGORY_KEYS = new Set<string>(INFRA_CATEGORY_ORDER.map((c) => c.key));

export interface InfraSource { label: string; url: string; }

// Compact item emitted by compress/score (parsed out of scored_drafts JSON).
export interface InfraScoredItem {
  title: string;
  category: InfraCategoryKey;
  facts: string;
  sources: InfraSource[];
  score: number;
  kind?: string;               // 实时 | 回顾
}

// Final rendered item (after merge expands the prose fields).
export interface InfraReportItem {
  title: string;
  maturity: string;    // 成熟度/状态标签：GA / Beta / RC / 补丁修复 / 新特性 / 解读 …
  points: string;      // 要点
  why: string;         // 为什么重要（合并原「解决什么问题」+「落地价值」）
  scenarios: string;   // 适用场景
  caveats: string;     // 注意事项（含破坏性变更）
  action: string;      // 行动建议：生产可升 / 预发验证后升 / 仅关注 …
  score: number;
  sources: InfraSource[];
}

export interface InfraReportCategory {
  key: InfraCategoryKey;
  label: string;
  empty_note: string | null;   // non-null → render "本周无可核验更新"
  items: InfraReportItem[];
}

export interface InfraRecommendation { audience: string; text: string; }

export interface InfraWeeklyPayload {
  title: string;
  week_label: string;
  headline: string;
  overview: string;
  summary: string;
  tags: string[];
  categories: InfraReportCategory[];
  trends: string[];
  recommendations: InfraRecommendation[];
}

function parseSources(raw: unknown): InfraSource[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((s): InfraSource[] => {
    if (!s || typeof s !== 'object') return [];
    const o = s as Record<string, unknown>;
    const url = typeof o.url === 'string' ? o.url : '';
    if (!url) return [];
    const label = typeof o.label === 'string' && o.label ? o.label : url;
    return [{ label, url }];
  });
}

/** Tolerant parse of a scored_drafts JSON array. Skips malformed items. */
export function parseInfraScoredItems(jsonText: string): InfraScoredItem[] {
  let s = jsonText.trim();
  // Strip a surrounding ```json ... ``` (or ``` ... ```) code fence — LLMs commonly wrap output.
  const fence = s.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (fence && fence[1] !== undefined) s = fence[1].trim();
  // Slice to the outermost array in case of leading/trailing prose.
  const first = s.indexOf('[');
  const last = s.lastIndexOf(']');
  if (first !== -1 && last > first) s = s.slice(first, last + 1);
  let raw: unknown;
  try { raw = JSON.parse(s); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  const out: InfraScoredItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title.trim() : '';
    const category = typeof o.category === 'string' && CATEGORY_KEYS.has(o.category)
      ? (o.category as InfraCategoryKey) : null;
    if (!title || !category) continue;
    const facts = typeof o.facts === 'string' ? o.facts : '';
    const score = typeof o.score === 'number'
      ? o.score
      : Number.isFinite(Number(o.score)) ? Number(o.score) : 0;
    const kind = typeof o.kind === 'string' ? o.kind : undefined;
    out.push({
      title, category, facts, score,
      sources: parseSources(o.sources),
      ...(kind ? { kind } : {}),
    });
  }
  return out;
}
