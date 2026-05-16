// One-off: regenerate Chinese descriptions for existing cover_images rows
// whose description looks English (legacy from older reutersImage prompt).
// Idempotent — rows already in Chinese are skipped.
import { createDb } from '../../src/lib/db.js';
import { callLlm } from '../../src/lib/llm.js';
import { createLogger } from '../../src/lib/log.js';

const db = createDb();
const log = createLogger({ channel: 'ai', step: 'cover-translate' });

function looksChinese(s: string | null | undefined): boolean {
  if (!s) return false;
  // crude — any CJK char means treat as already-Chinese
  return /[一-鿿]/.test(s);
}

// Re-translate Chinese strings that are too short (legacy from when prompt
// asked for ≤40 chars; new prompt asks for 30-60 chars with key details).
const MIN_CN_LEN = 25;
function needsRegenerate(s: string | null | undefined): boolean {
  if (!s) return false;
  if (!looksChinese(s)) return true;     // English → translate
  return [...s].length < MIN_CN_LEN;     // Chinese but too short → regenerate
}

async function main() {
  const { data, error } = await db
    .from('cover_images')
    .select('id, description, source')
    .eq('channel', 'ai');
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  console.log(`scanning ${rows.length} cover_images rows`);

  for (const r of rows) {
    if (!r.description) {
      console.log(`  id=${r.id} no description — skip`);
      continue;
    }
    if (!needsRegenerate(r.description)) {
      console.log(`  id=${r.id} already good Chinese (≥${MIN_CN_LEN} chars) — skip`);
      continue;
    }
    const prompt = `把下面这条 Reuters 图片说明改写成 1 句中文（30-60 字），传达图片所代表的事件 / 场景本身。要求：

- 包含主体（人/组织）+ 行为 + 地点（如有）+ 关键节目/活动名（如有，可保留原英文/中文）
- **不要过度精简到丢失关键细节**，例如人名、地名、节目名都要保留
- 不要直译英文 caption，要传达事件本身

仅输出 JSON: {"description": "..."}.

原文 (英文 caption)：
${r.description}

邮件主题（背景参考）：
${r.source ?? '(unknown)'}`;
    log.info({ event: 'translating', id: r.id, en: r.description }, '');
    const out = await callLlm<{ description: string }>({
      prompt,
      expectJson: true,
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 200,
      log,
    });
    const zh = out.json?.description?.trim();
    if (!zh || !looksChinese(zh)) {
      console.log(`  id=${r.id} LLM produced empty/non-Chinese — skip`);
      continue;
    }
    const { error: upErr } = await db
      .from('cover_images')
      .update({ description: zh } as never)
      .eq('id', r.id);
    if (upErr) {
      console.error(`  id=${r.id} update failed: ${upErr.message}`);
      continue;
    }
    console.log(`  id=${r.id} → "${zh}"`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
