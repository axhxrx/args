import { expect } from '@std/expect';
import { describe, test } from 'node:test';

import { groupArgs, type OptionDefinition } from '../src/index.ts';

const sampleOptions: OptionDefinition[] = [
  { long: 'verbose' },
  { long: 'dry-run' },
  { long: 'retry', short: 'r', requiresValue: true },
  { long: 'assert', requiresValue: true },
  { long: 'status-code', requiresValue: true },
  { short: 'a' },
  { short: 'b' },
  { short: 'n', requiresValue: true },
  { short: 'I', requiresValue: true },
];

describe('groupArgs', () =>
{
  describe('basic grouping', () =>
  {
    test('1. empty argv returns empty globalOptions and empty groups', () =>
    {
      const result = groupArgs([], { options: sampleOptions });
      expect(result.globalOptions).toEqual([]);
      expect(result.groups).toEqual([]);
    });

    test('2. all-positionals argv produces one empty-options group per positional', () =>
    {
      const result = groupArgs(['a.txt', 'b.txt', 'c.txt'], { options: sampleOptions });
      expect(result.globalOptions).toEqual([]);
      expect(result.groups).toEqual([
        { positional: 'a.txt', options: [] },
        { positional: 'b.txt', options: [] },
        { positional: 'c.txt', options: [] },
      ]);
    });

    test('3. all-globals argv produces empty groups and all tokens in globalOptions', () =>
    {
      const result = groupArgs(['--verbose', '--retry', '3'], { options: sampleOptions });
      expect(result.groups).toEqual([]);
      expect(result.globalOptions).toEqual(['--verbose', '--retry', '3']);
    });

    test('4. following binding: options after a positional bind to it', () =>
    {
      const result = groupArgs(
        ['pos1', '--verbose', '--retry', '3'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual([]);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--verbose', '--retry', '3'] },
      ]);
    });

    test('5. preceding binding: options before a positional bind to it', () =>
    {
      const result = groupArgs(
        ['--verbose', '--retry', '3', 'pos1'],
        { binding: 'preceding', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual([]);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--verbose', '--retry', '3'] },
      ]);
    });

    test('6. following binding: options before the first positional are globals', () =>
    {
      const result = groupArgs(
        ['--verbose', 'pos1', '--retry', '3'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual(['--verbose']);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--retry', '3'] },
      ]);
    });

    test('7. preceding binding: options after the last positional are in globalOptions', () =>
    {
      const result = groupArgs(
        ['pos1', '--verbose'],
        { binding: 'preceding', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual(['--verbose']);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: [] },
      ]);
    });

    test('default binding is following', () =>
    {
      const result = groupArgs(
        ['--verbose', 'pos1', '--retry', '3'],
        { options: sampleOptions },
      );
      expect(result.globalOptions).toEqual(['--verbose']);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--retry', '3'] },
      ]);
    });

    test('preceding binding across multiple positionals keeps local options local', () =>
    {
      const result = groupArgs(
        ['--a', 'pos1', '--b', 'bv', 'pos2'],
        {
          binding: 'preceding',
          options: [{ long: 'a' }, { long: 'b', requiresValue: true }],
        },
      );
      expect(result.globalOptions).toEqual([]);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--a'] },
        { positional: 'pos2', options: ['--b', 'bv'] },
      ]);
    });

    test('following binding across multiple positionals keeps local options local', () =>
    {
      const result = groupArgs(
        ['--verbose', 'pos1', '--retry', '3', '--assert=ready', 'pos2', '--status-code', '200'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual(['--verbose']);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--retry', '3', '--assert=ready'] },
        { positional: 'pos2', options: ['--status-code', '200'] },
      ]);
    });
  });

  describe('option shapes', () =>
  {
    test('8. flag option with no value is preserved as --flag', () =>
    {
      const result = groupArgs(
        ['pos', '--verbose'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--verbose'] }]);
    });

    test('9. value option with space-separated value is preserved as two tokens', () =>
    {
      const result = groupArgs(
        ['pos', '--retry', '3'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--retry', '3'] }]);
    });

    test('10. value option with inline --opt=value is preserved as one token', () =>
    {
      const result = groupArgs(
        ['pos', '--retry=3'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--retry=3'] }]);
    });

    test('11. value option with inline --opt= (empty) is preserved as one token', () =>
    {
      const result = groupArgs(
        ['pos', '--retry='],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--retry='] }]);
    });

    test('11b. trailing --opt= with no positional after it goes to globals', () =>
    {
      const result = groupArgs(
        ['--retry='],
        { options: [{ long: 'retry', requiresValue: true }] },
      );
      expect(result.globalOptions).toEqual(['--retry=']);
      expect(result.groups).toEqual([]);
    });

    test('12. short flag -x is preserved', () =>
    {
      const result = groupArgs(
        ['pos', '-a'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['-a'] }]);
    });

    test('13. short value option -x v is preserved as two tokens', () =>
    {
      const result = groupArgs(
        ['pos', '-n', '3'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['-n', '3'] }]);
    });

    test('14. short value option -x=v is preserved as one token', () =>
    {
      const result = groupArgs(
        ['pos', '-n=v'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['-n=v'] }]);
    });

    test('short value option -x= (empty inline) is accepted as one token', () =>
    {
      const result = groupArgs(
        ['pos', '-n='],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['-n='] }]);
    });

    test('attached-without-equals short value (e.g. -n3) throws (per SPEC)', () =>
    {
      // SPEC lists only `-x`, `-x VALUE`, `-x=VALUE`. Bare attached suffixes
      // are ambiguous with bundling and rejected.
      expect(() => groupArgs(['pos', '-n3'], { binding: 'following', options: sampleOptions }))
        .toThrow('[@axhxrx/args] -n requires a value via');
    });

    test('attached-without-equals path-like short value throws (e.g. -I/usr/include)', () =>
    {
      expect(() => groupArgs(['pos', '-I/usr/include'], { binding: 'following', options: sampleOptions })).toThrow(
        '[@axhxrx/args] -I requires a value via',
      );
    });

    test('15. aliases: an option with multiple long names is recognized under each', () =>
    {
      const result = groupArgs(
        ['pos', '--one', '--two'],
        {
          binding: 'following',
          options: [{ long: ['one', 'two'] }],
        },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--one', '--two'] }]);
    });

    test('aliases: short and long alias both resolve to the same behaviour', () =>
    {
      const result = groupArgs(
        ['pos', '--retry', '3', '-r', '2'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([
        { positional: 'pos', options: ['--retry', '3', '-r', '2'] },
      ]);
    });

    test('an option-shaped next token is NOT consumed as a value; it throws Missing value', () =>
    {
      // SPEC: option-shaped next tokens count as "no value available". Callers
      // who want a literal dash-starting value must use `--assert=--not-found`.
      expect(() =>
        groupArgs(
          ['pos', '--assert', '--not-found'],
          { binding: 'following', options: sampleOptions },
        )
      ).toThrow('[@axhxrx/args] Missing value for --assert');
    });

    test('an option-shaped next token that is a registered short option also throws', () =>
    {
      expect(() =>
        groupArgs(
          ['pos', '--assert', '-a'],
          { binding: 'following', options: sampleOptions },
        )
      ).toThrow('[@axhxrx/args] Missing value for --assert');
    });

    test('a `--` terminator as the next token after a value option throws Missing value', () =>
    {
      // `--` is option-shaped per the spec — the tokenizer does not swallow the
      // terminator as a value.
      expect(() => groupArgs(['pos', '--assert', '--'], { options: sampleOptions })).toThrow(
        '[@axhxrx/args] Missing value for --assert',
      );
    });

    test('value option with inline negative value: --retry=-5', () =>
    {
      const result = groupArgs(
        ['pos', '--retry=-5'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--retry=-5'] }]);
    });
  });

  describe('runtime parse errors', () =>
  {
    // Registration-time errors (cases 20-22) live in test/validation.test.ts.

    test('16. unknown long option throws', () =>
    {
      expect(() => groupArgs(['--wat'], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] Unknown option: --wat');
    });

    test('17. unknown short option throws', () =>
    {
      expect(() => groupArgs(['-z'], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] Unknown option: -z');
    });

    test('18. missing required value for a long option throws', () =>
    {
      expect(() => groupArgs(['--retry'], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] Missing value for --retry');
    });

    test('18b. missing required value for a short option throws', () =>
    {
      expect(() => groupArgs(['-n'], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] Missing value for -n');
    });

    test('19. flag given a value via --flag=x throws', () =>
    {
      expect(() =>
        groupArgs(
          ['--verbose=true'],
          { options: sampleOptions },
        )
      ).toThrow('[@axhxrx/args] --verbose does not take a value');
    });

    test('19b. flag given an empty value via --flag= also throws', () =>
    {
      expect(() => groupArgs(['--verbose='], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] --verbose does not take a value');
    });

    test('short flag given an attached value throws', () =>
    {
      expect(() => groupArgs(['-ax'], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] -a does not take a value');
    });
  });

  describe('special tokens', () =>
  {
    test('23. -- terminates option parsing; everything after is positional', () =>
    {
      const result = groupArgs(
        ['--verbose', 'pos1', '--', '--not-an-option', '-5'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual(['--verbose']);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: [] },
        { positional: '--not-an-option', options: [] },
        { positional: '-5', options: [] },
      ]);
    });

    test('24. -- in the middle of a group passes through cleanly (no orphan empty group)', () =>
    {
      // The terminator itself is not emitted — the token after the current one
      // simply becomes a positional with no associated group-break beyond that.
      const result = groupArgs(
        ['pos1', '--verbose', '--', '--tail'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.globalOptions).toEqual([]);
      expect(result.groups).toEqual([
        { positional: 'pos1', options: ['--verbose'] },
        { positional: '--tail', options: [] },
      ]);
    });

    test('25. -5 is a positional by default', () =>
    {
      const result = groupArgs(['-5'], { options: sampleOptions });
      expect(result.groups).toEqual([{ positional: '-5', options: [] }]);
      expect(result.globalOptions).toEqual([]);
    });

    test('26. -5 is the registered short option when { short: "5" } is defined', () =>
    {
      const result = groupArgs(
        ['-5', 'pos'],
        { binding: 'preceding', options: [{ short: '5' }] },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['-5'] }]);
      expect(result.globalOptions).toEqual([]);
    });

    test('27. -3.14 is a positional', () =>
    {
      const result = groupArgs(['-3.14'], { options: sampleOptions });
      expect(result.groups).toEqual([{ positional: '-3.14', options: [] }]);
    });

    test('28. -1e9 is a positional', () =>
    {
      const result = groupArgs(['-1e9'], { options: sampleOptions });
      expect(result.groups).toEqual([{ positional: '-1e9', options: [] }]);
    });

    test('29. -.5 is a positional', () =>
    {
      const result = groupArgs(['-.5'], { options: sampleOptions });
      expect(result.groups).toEqual([{ positional: '-.5', options: [] }]);
    });

    test('30. -.help throws as unknown option', () =>
    {
      expect(() => groupArgs(['-.help'], { options: sampleOptions }))
        .toThrow('[@axhxrx/args] Unknown option: -.');
    });

    test('lone dash is a positional', () =>
    {
      const result = groupArgs(['-'], { options: sampleOptions });
      expect(result.groups).toEqual([{ positional: '-', options: [] }]);
    });

    test('negative number after a value-requiring long option is consumed as the value', () =>
    {
      const result = groupArgs(
        ['pos', '--retry', '-5'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['--retry', '-5'] }]);
    });

    test('negative number after a value-requiring short option is consumed as the value', () =>
    {
      const result = groupArgs(
        ['pos', '-n', '-5'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([{ positional: 'pos', options: ['-n', '-5'] }]);
    });

    test('a weird suffix after a digit still counts as positional (e.g. -5abc)', () =>
    {
      const result = groupArgs(['-5abc'], { options: sampleOptions });
      expect(result.groups).toEqual([{ positional: '-5abc', options: [] }]);
    });
  });

  describe('repetition preservation', () =>
  {
    test('31. repeated flags appear multiple times in the group', () =>
    {
      const result = groupArgs(
        ['pos', '--verbose', '--verbose'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([
        { positional: 'pos', options: ['--verbose', '--verbose'] },
      ]);
    });

    test('32. repeated value options appear multiple times in the group', () =>
    {
      const result = groupArgs(
        ['pos', '--retry', '3', '--retry=5'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([
        { positional: 'pos', options: ['--retry', '3', '--retry=5'] },
      ]);
    });

    test('33. option order within a group is preserved', () =>
    {
      const result = groupArgs(
        ['pos', '-a', '--retry', '3', '-b', '--verbose'],
        { binding: 'following', options: sampleOptions },
      );
      expect(result.groups).toEqual([
        { positional: 'pos', options: ['-a', '--retry', '3', '-b', '--verbose'] },
      ]);
    });
  });
});
