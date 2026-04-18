import { expect } from '@std/expect';
import { describe, test } from 'node:test';

import { type Token, tokenize } from '../src/tokenizer.ts';
import type { OptionDefinition } from '../src/types/OptionDefinition.ts';
import { buildOptionRegistry } from '../src/validation.ts';

function tokens(argv: string[], defs: OptionDefinition[] = []): Token[]
{
  return tokenize(argv, buildOptionRegistry(defs));
}

describe('tokenize edge cases', () =>
{
  test('empty argv produces no tokens', () =>
  {
    expect(tokens([])).toEqual([]);
  });

  test('positional preserves exact value', () =>
  {
    expect(tokens(['pos with spaces'])).toEqual([
      { kind: 'positional', value: 'pos with spaces' },
    ]);
  });

  test('`--` terminator is consumed, not emitted', () =>
  {
    expect(tokens(['--', '--foo'])).toEqual([
      { kind: 'positional', value: '--foo' },
    ]);
  });

  test('trailing `--` with nothing after produces no tokens', () =>
  {
    expect(tokens(['--'])).toEqual([]);
  });

  test('negative number heuristic falls through to option when short is registered', () =>
  {
    const result = tokens(['-5'], [{ short: '5' }]);
    expect(result).toEqual([
      { kind: 'option', rawTokens: ['-5'] },
    ]);
  });

  test('value option with an option-shaped next token throws Missing value', () =>
  {
    expect(() =>
      tokens(
        ['--assert', '--not-found', 'after'],
        [{ long: 'assert', requiresValue: true }],
      )
    ).toThrow('[@axhxrx/args] Missing value for --assert');
  });

  test('value option accepts a negative-number next token as its value', () =>
  {
    const result = tokens(
      ['--retry', '-5', 'after'],
      [{ long: 'retry', requiresValue: true }],
    );
    expect(result).toEqual([
      { kind: 'option', rawTokens: ['--retry', '-5'] },
      { kind: 'positional', value: 'after' },
    ]);
  });

  test('inline `--foo=value` is one raw token', () =>
  {
    const result = tokens(['--retry=3'], [{ long: 'retry', requiresValue: true }]);
    expect(result).toEqual([
      { kind: 'option', rawTokens: ['--retry=3'] },
    ]);
  });

  test('flag after `--` is a positional even when it matches a registration', () =>
  {
    const result = tokens(['--', '--verbose'], [{ long: 'verbose' }]);
    expect(result).toEqual([
      { kind: 'positional', value: '--verbose' },
    ]);
  });
});
