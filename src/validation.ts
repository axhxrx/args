import type { OptionDefinition } from './types/OptionDefinition.ts';

/**
 Internal behaviour of a registered option — what the tokenizer needs after the definitions have been validated.
 */
export interface OptionBehavior
{
  requiresValue: boolean;
}

/**
 Registry of long and short options built from a list of `OptionDefinition`.

 Both maps key on the bare name (no leading dashes) and point at the same behaviour object when an option has both long and short aliases.
 */
export interface OptionRegistry
{
  longOptions: Map<string, OptionBehavior>;
  shortOptions: Map<string, OptionBehavior>;
}

export const ERROR_PREFIX = '[@axhxrx/args]';

/**
 Long option names are restricted to the characters that survive a round-trip through the tokenizer.

 `=` would collide with the `--name=value` inline-value split, and whitespace or control characters produce confusing "Unknown option" errors at runtime. Keeping the allowed set to `[A-Za-z][A-Za-z0-9_-]*` rules out unreachable registrations at definition time instead of deferring failure.
 */
const LONG_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 Short option names are always exactly one character. The same reachability concern as long names applies, so reject anything outside `[A-Za-z0-9]`.
 */
const SHORT_NAME_PATTERN = /^[A-Za-z0-9]$/;

function normalizeNames(names?: string | readonly string[]): string[]
{
  if (names === undefined)
  {
    return [];
  }

  return typeof names === 'string' ? [names] : [...names];
}

function validateLongName(name: string): void
{
  if (!LONG_NAME_PATTERN.test(name))
  {
    throw new Error(`${ERROR_PREFIX} Long option names must match [A-Za-z][A-Za-z0-9_-]*: "${name}"`);
  }
}

function validateShortName(name: string): void
{
  if (!SHORT_NAME_PATTERN.test(name))
  {
    throw new Error(`${ERROR_PREFIX} Short option names must match [A-Za-z0-9]: "${name}"`);
  }
}

function register(
  registry: Map<string, OptionBehavior>,
  name: string,
  behavior: OptionBehavior,
  kind: 'long' | 'short',
): void
{
  if (registry.has(name))
  {
    const prefix = kind === 'long' ? '--' : '-';
    throw new Error(`${ERROR_PREFIX} Duplicate registration: ${prefix}${name}`);
  }

  registry.set(name, behavior);
}

/**
 Build the long/short option registries from a list of `OptionDefinition`.

 Throws on invalid or duplicate names, or on an empty definition entry.
 */
export function buildOptionRegistry(definitions: readonly OptionDefinition[]): OptionRegistry
{
  const longOptions = new Map<string, OptionBehavior>();
  const shortOptions = new Map<string, OptionBehavior>();

  for (const definition of definitions)
  {
    const longNames = normalizeNames(definition.long);
    const shortNames = normalizeNames(definition.short);

    if (longNames.length === 0 && shortNames.length === 0)
    {
      throw new Error(`${ERROR_PREFIX} Each option definition must provide at least one long or short name`);
    }

    const behavior: OptionBehavior = { requiresValue: definition.requiresValue ?? false };

    for (const longName of longNames)
    {
      validateLongName(longName);
      register(longOptions, longName, behavior, 'long');
    }

    for (const shortName of shortNames)
    {
      validateShortName(shortName);
      register(shortOptions, shortName, behavior, 'short');
    }
  }

  return { longOptions, shortOptions };
}
