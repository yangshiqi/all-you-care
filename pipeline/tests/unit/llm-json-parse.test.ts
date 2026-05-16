import { describe, it, expect } from 'vitest';
import { extractJsonObject } from '../../src/lib/llm.js';

describe('extractJsonObject', () => {
  it('parses bare JSON', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });
  it('strips ```json fence', () => {
    expect(extractJsonObject('```json\n{"a":2}\n```')).toEqual({ a: 2 });
  });
  it('strips ``` fence without language', () => {
    expect(extractJsonObject('```\n{"a":3}\n```')).toEqual({ a: 3 });
  });
  it('slices first { to last }', () => {
    expect(extractJsonObject('blah blah {"a":4} trailing')).toEqual({ a: 4 });
  });
  it('handles nested braces', () => {
    expect(extractJsonObject('{"a":{"b":5}}')).toEqual({ a: { b: 5 } });
  });
  it('throws on no object', () => {
    expect(() => extractJsonObject('no json here')).toThrow(/no JSON object/);
  });
  it('throws on truncated json with detail', () => {
    expect(() => extractJsonObject('{"a":"unfinished string')).toThrow();
  });
});
