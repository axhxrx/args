import type { OptionDefinition } from './types/OptionDefinition.ts';

/**
 Partition a list of names into long and short by length.

 Per the library grammar, short options are always exactly one character and long options are always two or more. That lets the helpers dispatch automatically from a flat variadic list of names without any marker syntax.
 */
function partition(names: readonly string[]): { long: string[]; short: string[] }
{
  const long: string[] = [];
  const short: string[] = [];

  for (const name of names)
  {
    if (name.length === 1)
    {
      short.push(name);
    }
    else
    {
      long.push(name);
    }
  }

  return { long, short };
}

function build(names: readonly string[], requiresValue: boolean): OptionDefinition
{
  const { long, short } = partition(names);
  const definition: OptionDefinition = {};

  if (long.length === 1)
  {
    definition.long = long[0];
  }
  else if (long.length > 1)
  {
    definition.long = long;
  }

  if (short.length === 1)
  {
    definition.short = short[0];
  }
  else if (short.length > 1)
  {
    definition.short = short;
  }

  if (requiresValue)
  {
    definition.requiresValue = true;
  }

  return definition;
}

/**
 Construct an `OptionDefinition` for a **flag** — an option that takes no value.

 Pass the primary name first, then any aliases. Single-character names register as short options; multi-character names register as long options.

 ```ts
 flag('verbose')            // --verbose
 flag('verbose', 'v')       // --verbose, -v
 flag('dry-run', 'n')       // --dry-run, -n
 flag('version', 'V', 'v')  // --version, -V, -v
 ```

 Name validity is enforced at registration time by `groupArgs`, not here — the helper is a thin constructor.
 */
export function flag(primary: string, ...aliases: string[]): OptionDefinition
{
  return build([primary, ...aliases], false);
}

/**
 Construct an `OptionDefinition` for a **value option** — an option that requires a value.

 Dispatch rules are identical to `flag`: the first name is the primary, additional names are aliases, single-character names become short options, multi-character names become long options.

 ```ts
 valueOption('retry')             // --retry, requires value
 valueOption('retry', 'r')        // --retry, -r, requires value
 valueOption('output', 'o')       // --output, -o, requires value
 ```

 The returned definition has `requiresValue: true`. For an option whose name you want to build up manually (e.g. an option registered only by a single-character long name), construct the `OptionDefinition` object directly.
 */
export function valueOption(primary: string, ...aliases: string[]): OptionDefinition
{
  return build([primary, ...aliases], true);
}
