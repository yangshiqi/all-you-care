import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/lib/prompt.js';

describe('renderTemplate', () => {
  it('substitutes {{var}}', () => {
    expect(renderTemplate('hi {{name}}', { name: 'a' })).toBe('hi a');
  });
  it('throws on missing var', () => {
    expect(() => renderTemplate('hi {{name}}', {})).toThrow(/missing var: name/);
  });
  it('handles multiple vars', () => {
    expect(renderTemplate('{{a}}+{{b}}', { a: '1', b: '2' })).toBe('1+2');
  });
  it('leaves unmatched braces alone if no double-brace', () => {
    expect(renderTemplate('plain {single}', {})).toBe('plain {single}');
  });
});
