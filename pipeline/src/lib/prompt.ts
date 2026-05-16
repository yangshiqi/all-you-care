import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type Vars = Record<string, string>;

export function renderTemplate(tpl: string, vars: Vars): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    if (!(key in vars)) throw new Error(`prompt template missing var: ${key}`);
    return vars[key]!;
  });
}

export interface UntrustedItem {
  source: string;
  content: string;
}

function escapeTags(s: string): string {
  return s
    .replace(/<\/source_content>/gi, '&lt;/source_content&gt;')
    .replace(/<source_content>/gi,   '&lt;source_content&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

export function wrapUntrustedItems(items: UntrustedItem[]): string {
  const inner = items.map((it, i) =>
    `<item index="${i + 1}" source="${escapeAttr(it.source)}">\n${escapeTags(it.content)}\n</item>`
  ).join('\n');
  return `<source_content>\n${inner}\n</source_content>`;
}

export async function loadPrompt(channelDir: string, step: string, vars: Vars = {}): Promise<string> {
  const path = join(channelDir, 'prompts', `${step}.md`);
  const tpl = await readFile(path, 'utf8');
  return renderTemplate(tpl, vars);
}
