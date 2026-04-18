import { expect } from '@std/expect';
import { describe, test } from 'node:test';

import { groupArgs } from '../src/index.ts';

/**
 Registration-time validation: names, aliases, and duplicate detection.

 These errors surface before any argv parsing — calling `groupArgs([], { options: [...] })` is enough to trigger them.
 */
describe('option definition validation', () =>
{
  describe('long name pattern [A-Za-z][A-Za-z0-9_-]*', () =>
  {
    test('21. rejects names containing =', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'foo=bar' }] }))
        .toThrow('[@axhxrx/args] Long option names must match [A-Za-z][A-Za-z0-9_-]*: "foo=bar"');
    });

    test('21b. rejects names starting with a digit', () =>
    {
      expect(() => groupArgs([], { options: [{ long: '3way' }] }))
        .toThrow('[@axhxrx/args] Long option names must match [A-Za-z][A-Za-z0-9_-]*: "3way"');
    });

    test('21c. rejects empty name', () =>
    {
      expect(() => groupArgs([], { options: [{ long: '' }] }))
        .toThrow('[@axhxrx/args] Long option names must match [A-Za-z][A-Za-z0-9_-]*: ""');
    });

    test('21d. rejects names containing whitespace', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'foo bar' }] }))
        .toThrow('[@axhxrx/args] Long option names must match [A-Za-z][A-Za-z0-9_-]*: "foo bar"');
    });

    test('rejects names containing punctuation', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'foo!' }] }))
        .toThrow('[@axhxrx/args] Long option names must match [A-Za-z][A-Za-z0-9_-]*: "foo!"');
    });

    test('rejects names containing a dot', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'foo.bar' }] }))
        .toThrow('[@axhxrx/args] Long option names must match [A-Za-z][A-Za-z0-9_-]*: "foo.bar"');
    });

    test('21e. accepts hyphenated names', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'two-way' }] })).not.toThrow();
    });

    test('21f. accepts underscored names', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'foo_bar' }] })).not.toThrow();
    });

    test('accepts names mixing letters and digits after the first letter', () =>
    {
      expect(() => groupArgs([], { options: [{ long: 'a1b2' }] })).not.toThrow();
    });
  });

  describe('short name pattern [A-Za-z0-9]', () =>
  {
    test('22. rejects multi-character name', () =>
    {
      expect(() => groupArgs([], { options: [{ short: 'ab' }] }))
        .toThrow('[@axhxrx/args] Short option names must match [A-Za-z0-9]: "ab"');
    });

    test('22b. rejects punctuation', () =>
    {
      expect(() => groupArgs([], { options: [{ short: '?' }] }))
        .toThrow('[@axhxrx/args] Short option names must match [A-Za-z0-9]: "?"');
    });

    test('22c. rejects empty name', () =>
    {
      expect(() => groupArgs([], { options: [{ short: '' }] }))
        .toThrow('[@axhxrx/args] Short option names must match [A-Za-z0-9]: ""');
    });

    test('rejects underscore', () =>
    {
      expect(() => groupArgs([], { options: [{ short: '_' }] }))
        .toThrow('[@axhxrx/args] Short option names must match [A-Za-z0-9]: "_"');
    });

    test('accepts single letter', () =>
    {
      expect(() => groupArgs([], { options: [{ short: 'f' }] })).not.toThrow();
    });

    test('accepts single digit', () =>
    {
      expect(() => groupArgs([], { options: [{ short: '5' }] })).not.toThrow();
    });

    test('accepts uppercase letter', () =>
    {
      expect(() => groupArgs([], { options: [{ short: 'X' }] })).not.toThrow();
    });
  });

  describe('duplicates and empty definitions', () =>
  {
    test('20. duplicate long registration throws', () =>
    {
      expect(() =>
        groupArgs(
          [],
          { options: [{ long: 'verbose' }, { long: 'verbose' }] },
        )
      ).toThrow('[@axhxrx/args] Duplicate registration: --verbose');
    });

    test('20b. duplicate short registration throws', () =>
    {
      expect(() =>
        groupArgs(
          [],
          { options: [{ short: 'a' }, { short: 'a' }] },
        )
      ).toThrow('[@axhxrx/args] Duplicate registration: -a');
    });

    test('duplicate across long-and-short aliases throws', () =>
    {
      expect(() =>
        groupArgs(
          [],
          { options: [{ long: 'foo', short: 'f' }, { short: 'f' }] },
        )
      ).toThrow('[@axhxrx/args] Duplicate registration: -f');
    });

    test('empty option definition entry throws', () =>
    {
      expect(() => groupArgs([], { options: [{}] }))
        .toThrow('[@axhxrx/args] Each option definition must provide at least one long or short name');
    });
  });
});
