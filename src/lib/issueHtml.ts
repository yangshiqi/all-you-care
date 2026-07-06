// src/lib/issueHtml.ts
// Shared helpers for stripping the pipeline's full-HTML-document shell
// (wrapShell in pipeline/src/steps/render.ts) down to a renderable fragment.
//
// NOTE: these are intentionally verbatim copies of the local helpers in
// src/app/[lang]/issues/[slug]/page.tsx (lines 113-135). That page keeps its
// own local copies untouched to avoid risk to the AI channel; this module
// exists so the infra channel (which previously injected the raw content
// unprocessed) can share the same stripping logic without duplicating it
// a third time.

export function extractBodyContent(html: string): string {
  if (!html) return '';
  // 尝试匹配 body 标签内的内容
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }
  // 如果没有 body 标签，返回原始内容（可能已经是片段）
  return html;
}

// 新 pipeline 的 render 输出在 body 顶部带 <h1> 标题 / <p class="subtitle"> 日期 /
// <img class="hero-img"> 封面三件套，与外层 header 重复。这里剥掉避免重复展示。
export function stripDuplicateHeader(content: string): string {
  if (!content) return '';
  let cleaned = content;
  cleaned = cleaned.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, '');
  cleaned = cleaned.replace(/<p[^>]*class=["'][^"']*\bsubtitle\b[^"']*["'][^>]*>[\s\S]*?<\/p>/i, '');
  cleaned = cleaned.replace(/<img[^>]*class=["'][^"']*\bhero-img\b[^"']*["'][^>]*\/?>/i, '');
  return cleaned;
}
