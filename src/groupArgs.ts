import { tokenize } from './tokenizer.ts';
import type { ArgGroup } from './types/ArgGroup.ts';
import type { GroupArgsOptions } from './types/GroupArgsOptions.ts';
import type { GroupArgsResult } from './types/GroupArgsResult.ts';
import { buildOptionRegistry } from './validation.ts';

/**
 Slice `argv` into a `globalOptions` array and a list of positional-anchored `ArgGroup` entries.

 The caller controls whether options that modify a positional appear before it (`binding: 'preceding'`) or after it (`binding: 'following'`, the default). See SPEC.md for the full behaviour contract.

 Throws a plain `Error` prefixed with `[@axhxrx/args]` on unknown options, missing required values, flag options given an inline value, or invalid option-definition entries.
 */
export function groupArgs(argv: string[], options: GroupArgsOptions = {}): GroupArgsResult
{
  const binding = options.binding ?? 'following';
  const definitions = options.options ?? [];
  const registry = buildOptionRegistry(definitions);
  const tokens = tokenize(argv, registry);

  if (binding === 'following')
  {
    const groups: ArgGroup[] = [];
    const globalOptions: string[] = [];
    let currentGroup: ArgGroup | undefined;

    for (const token of tokens)
    {
      if (token.kind === 'positional')
      {
        currentGroup = { positional: token.value, options: [] };
        groups.push(currentGroup);
        continue;
      }

      if (currentGroup)
      {
        currentGroup.options.push(...token.rawTokens);
      }
      else
      {
        globalOptions.push(...token.rawTokens);
      }
    }

    return { globalOptions, groups };
  }

  const groups: ArgGroup[] = [];
  let pendingOptions: string[] = [];

  for (const token of tokens)
  {
    if (token.kind === 'option')
    {
      pendingOptions.push(...token.rawTokens);
      continue;
    }

    groups.push({ positional: token.value, options: pendingOptions });
    pendingOptions = [];
  }

  return { globalOptions: pendingOptions, groups };
}
