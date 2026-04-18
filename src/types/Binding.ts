/**
 Direction in which options bind to positionals.

 `'following'` means options AFTER a positional bind to it — any options before the first positional are returned as globals.

 `'preceding'` means options BEFORE a positional bind to it — any trailing options after the last positional are returned as globals for symmetry.
 */
export type Binding = 'preceding' | 'following';
