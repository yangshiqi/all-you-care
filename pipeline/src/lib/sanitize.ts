import sanitizeHtml from 'sanitize-html';

const ISSUE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'html','head','body','style',
    'div','span','p','br',
    'h1','h2','h3','h4',
    'article','blockquote',
    'ul','ol','li',
    'a','img','strong','em',
  ],
  allowedAttributes: {
    a:    ['href','target','rel','class'],
    img:  ['src','alt','class'],
    div:  ['class'],
    span: ['class'],
    article: ['class'],
    h1: ['class'], h2: ['class'], h3: ['class'], h4: ['class'],
  },
  allowedSchemes: ['https'],
  allowedSchemesByTag: { img: ['https'] },
  disallowedTagsMode: 'discard',
  allowedStyles: {},
  // Issue HTML embeds a scoped <style> block produced by our publish step.
  // We acknowledge the XSS risk and silence the library warning.
  allowVulnerableTags: true,
};

export function sanitizeIssueHtml(input: string): string {
  return sanitizeHtml(input, ISSUE_OPTIONS);
}
