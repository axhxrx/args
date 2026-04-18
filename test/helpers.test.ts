import { expect } from '@std/expect';
import { describe, test } from 'node:test';

import { flag, groupArgs, valueOption } from '../src/index.ts';

describe('flag()', () =>
{
  test('single long name produces a long-only definition', () =>
  {
    expect(flag('verbose')).toEqual({ long: 'verbose' });
  });

  test('long + short produces both', () =>
  {
    expect(flag('verbose', 'v')).toEqual({ long: 'verbose', short: 'v' });
  });

  test('multiple long names are an array', () =>
  {
    expect(flag('dry-run', 'noop')).toEqual({ long: ['dry-run', 'noop'] });
  });

  test('multiple short names are an array', () =>
  {
    expect(flag('version', 'V', 'v')).toEqual({ long: 'version', short: ['V', 'v'] });
  });

  test('single short name only', () =>
  {
    expect(flag('x')).toEqual({ short: 'x' });
  });

  test('does not set requiresValue', () =>
  {
    expect('requiresValue' in flag('verbose')).toBe(false);
  });

  test('integrates with groupArgs as a flag', () =>
  {
    const result = groupArgs(
      ['pos', '--verbose', '-v'],
      { options: [flag('verbose', 'v')] },
    );
    expect(result.groups).toEqual([
      { positional: 'pos', options: ['--verbose', '-v'] },
    ]);
  });
});

describe('valueOption()', () =>
{
  test('single long name', () =>
  {
    expect(valueOption('retry')).toEqual({ long: 'retry', requiresValue: true });
  });

  test('long + short', () =>
  {
    expect(valueOption('retry', 'r')).toEqual({
      long: 'retry',
      short: 'r',
      requiresValue: true,
    });
  });

  test('multiple aliases of both kinds', () =>
  {
    expect(valueOption('output', 'out', 'o', 'O')).toEqual({
      long: ['output', 'out'],
      short: ['o', 'O'],
      requiresValue: true,
    });
  });

  test('integrates with groupArgs as a value option', () =>
  {
    const result = groupArgs(
      ['pos', '--retry', '3', '-r=5'],
      { options: [valueOption('retry', 'r')] },
    );
    expect(result.groups).toEqual([
      { positional: 'pos', options: ['--retry', '3', '-r=5'] },
    ]);
  });

  test('integration: mixed helpers produce the same result as hand-written definitions', () =>
  {
    const argv = ['--verbose', 'pos1', '--retry', '3', 'pos2', '--status', '200'];

    const fromHelpers = groupArgs(argv, {
      options: [
        flag('verbose'),
        valueOption('retry', 'r'),
        valueOption('status'),
      ],
    });

    const fromLiterals = groupArgs(argv, {
      options: [
        { long: 'verbose' },
        { long: 'retry', short: 'r', requiresValue: true },
        { long: 'status', requiresValue: true },
      ],
    });

    expect(fromHelpers).toEqual(fromLiterals);
  });
});

describe('helper + registry errors', () =>
{
  test('invalid long name produced by helper still throws at registration', () =>
  {
    // `flag('foo.bar')` is syntactically valid TypeScript but not a legal long
    // name; the registry rejects it when groupArgs is called.
    expect(() => groupArgs([], { options: [flag('foo.bar')] })).toThrow(
      '[@axhxrx/args] Long option names must match',
    );
  });

  test('invalid short name produced by helper still throws at registration', () =>
  {
    expect(() => groupArgs([], { options: [flag('?')] })).toThrow(
      '[@axhxrx/args] Short option names must match',
    );
  });
});
