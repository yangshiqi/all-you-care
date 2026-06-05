/**
 * Coerce an LLM-provided persona assignment into a string array.
 *
 * The merge step types `persona_assignments[id]` as `Persona[]`, but that type
 * is an unchecked cast over raw LLM JSON — there is no runtime validation. When
 * the Anthropic proxy is down the LLM chain falls back to Gemini, which
 * sometimes returns a bare string ("engineer") instead of ["engineer"]. The
 * static type hides this, so on 2026-06-05 the merge step crashed with
 * "tags.find is not a function", the publish-pipeline failed, and the morning
 * email (the deliver step) was skipped. Normalize defensively so downstream
 * `.find()` / `.length` can never throw, whatever shape a provider returns.
 */
export function toPersonaTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === 'string');
  if (typeof raw === 'string') return [raw];
  return [];
}
