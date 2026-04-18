import type { ArgGroup } from './ArgGroup.ts';

/**
 Result of tokenising and grouping an argv array.

 `globalOptions` holds options that are not bound to any positional — these are the leading options for `'following'` binding, and the trailing options for `'preceding'` binding.

 `groups` is one entry per positional in input order.
 */
export interface GroupArgsResult
{
  globalOptions: string[];
  groups: ArgGroup[];
}
