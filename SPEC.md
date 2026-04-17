# `@axhxrx/args` Spec

Positional-anchored argument tokenizer for CLIs that accept a mixture of global options and per-positional option groups.

## Motivation

Standard POSIX argument parsers (argparse, commander, yargs) assume options are homogeneous: one flat namespace of options plus a sequence of positional arguments. That works poorly for CLIs like:

```sh
my-tool --verbose \
  "task A" --url http://a --timeout 10 \
  "task B" --url http://b --retries 3
```

where `--url`, `--timeout`, and `--retries` apply to a specific positional, not to the whole invocation.

`@axhxrx/args` solves one problem: slicing `argv` into groups anchored by positionals, without making any semantic decisions about what the options mean. Consumers receive the sliced token groups and validate them however they like.

## Non-goals

- Type conversion. Values stay as strings.
- Semantic validation of option combinations. Mutually-exclusive options, required-if-other-option-present rules, value ranges, etc. are all the caller's problem.
- Short-option bundling (`-abc` meaning `-a -b -c`).
- Optional option values (`--foo[=value]`).
- `process.argv` inspection. Input is always an explicit `string[]`.
- Pretty-printed usage strings. This is a tokenizer, not a help generator.
- Subcommand parsing in the git/docker sense. (A subcommand is a positional that happens to be the first one; users can post-process.)

## Public API

```ts
export function groupArgs(
  argv: string[],
  options?: GroupArgsOptions,
): GroupArgsResult

export type Binding = 'preceding' | 'following'

export interface GroupArgsOptions
{
  binding?: Binding
  options?: OptionDefinition[]
}

export interface OptionDefinition
{
  long?: string | readonly string[]
  short?: string | readonly string[]
  requiresValue?: boolean
}

export interface GroupArgsResult
{
  globalOptions: string[]
  groups: ArgGroup[]
}

export interface ArgGroup
{
  positional: string
  options: string[]
}
```

### Defaults

- `binding`: `'following'` (options after a positional bind to it).
- `options`: `[]` (no registered options — see "Unknown options" below).

### Binding

- `'following'` (default): options AFTER a positional bind to it. The first group (before the first positional) is global.
  ```
  --global-a  pos1  --opt-of-pos1  --opt-of-pos1-2  pos2  --opt-of-pos2
  ```
- `'preceding'`: options BEFORE a positional bind to it. There is no "global" group in the same sense; a final trailing run of options after the last positional is returned as `globalOptions` for symmetry.
  ```
  --opt-of-pos1  --opt-of-pos1-2  pos1  --opt-of-pos2  pos2
  ```

Callers with globals-and-per-positional semantics typically want `'following'`. Callers with per-positional-prefix semantics want `'preceding'`.

## Tokenization rules

### Options

- Long option: `--name` (flag) or `--name VALUE` / `--name=VALUE` (value option).
- Short option: `-x` (flag) or `-x VALUE` / `-x=VALUE` (value option). Each short name is exactly one character.
- Flags do NOT accept an inline value. `--flag=foo` throws when `--flag` is a registered flag.
- Value options with `requiresValue: true` throw if no value is available (next token is absent, or is an option-shaped token).
- Inline values with `--name=` (empty string after `=`) are accepted as empty-string values. The tokenizer is intentionally semantics-free: consumers that want to reject empty values do so themselves.
- Repeated options (same `--name` appearing multiple times) are preserved in the output groups. The tokenizer does not flag duplicates — some options are legitimately repeatable (e.g. HTTP headers).

### Positionals

- Any token that is not an option is a positional.
- A token starting with `-` followed immediately by a digit or `.digit` is treated as a positional, not an option. Examples that become positionals: `-5`, `-3.14`, `-1e9`, `-.5`. This matches the convention used by argparse and commander: negative numbers are valid positionals.
  - EXCEPTION: if a short option is explicitly registered with that digit as its name (e.g. `{ short: '5' }`), then `-5` is parsed as the option. Explicit registration wins over the heuristic.
- `-.help` does NOT match the negative-number heuristic (a dot must be followed by a digit). A token like `-.help` produces an "Unknown option" error rather than being silently accepted as a positional.

### Terminator

- `--` ends option parsing. Every subsequent token is a positional, including tokens that start with `-` or `--`.

### Unknown options

- If a token looks like an option (`-x` or `--xxx`) and no matching definition exists in `options`, the tokenizer throws `Error` with a clear message. Consumers opting in to permissive behavior can register the option with `requiresValue: false` to accept it as a flag.

## Errors thrown

Every error is a plain `Error` with a message prefixed by `[@axhxrx/args]`. The specific conditions:

- `Unknown option: --foo` — token matched the option shape but is not registered.
- `Missing value for --foo` — registered as `requiresValue: true` but no value follows.
- `--foo does not take a value` — registered as a flag but invoked with `--foo=value`.
- `Duplicate registration: --foo` — two definitions in `options` claim the same name.
- `Each option definition must provide at least one long or short name` — empty definition entry.
- `Long option names must match [A-Za-z][A-Za-z0-9_-]*` — invalid registered name.
- `Short option names must match [A-Za-z0-9]` — invalid registered name.

## Worked examples

### Following binding

```ts
groupArgs(
  ['--global-a', 'av', 'pos1', '--local-a', 'pos2', '--local-b', 'bv'],
  {
    binding: 'following',
    options: [
      { long: 'global-a', requiresValue: true },
      { long: 'local-a' },
      { long: 'local-b', requiresValue: true },
    ],
  },
)
// => {
//   globalOptions: ['--global-a', 'av'],
//   groups: [
//     { positional: 'pos1', options: ['--local-a'] },
//     { positional: 'pos2', options: ['--local-b', 'bv'] },
//   ],
// }
```

### Preceding binding

```ts
groupArgs(
  ['--a', 'pos1', '--b', 'bv', 'pos2'],
  {
    binding: 'preceding',
    options: [{ long: 'a' }, { long: 'b', requiresValue: true }],
  },
)
// => {
//   globalOptions: [],
//   groups: [
//     { positional: 'pos1', options: ['--a'] },
//     { positional: 'pos2', options: ['--b', 'bv'] },
//   ],
// }
```

### `--` terminator

```ts
groupArgs(
  ['--flag', 'pos1', '--', '--not-an-option', '-5'],
  { options: [{ long: 'flag' }] },
)
// => {
//   globalOptions: ['--flag'],
//   groups: [
//     { positional: 'pos1', options: [] },
//     { positional: '--not-an-option', options: [] },
//     { positional: '-5', options: [] },
//   ],
// }
```

### Negative-number positionals

```ts
groupArgs(['pos1', '-5', '-3.14'], { options: [] })
// => {
//   globalOptions: [],
//   groups: [
//     { positional: 'pos1', options: [] },
//     { positional: '-5', options: [] },
//     { positional: '-3.14', options: [] },
//   ],
// }
```

### Empty inline value

```ts
groupArgs(['--foo='], { options: [{ long: 'foo', requiresValue: true }] })
// => { globalOptions: ['--foo='], groups: [] }
// The caller inspecting the group tokens sees the inline-empty form preserved.
```

## Test matrix

These are the implementation-driving tests. Numbering is not sacred but behaviour coverage is.

### Basic grouping
1. Empty argv returns empty `globalOptions` and empty `groups`.
2. All-positionals argv produces one empty-options group per positional.
3. All-globals argv (no positional) produces empty `groups` and all tokens in `globalOptions`.
4. Following binding: options after a positional bind to it.
5. Preceding binding: options before a positional bind to it.
6. Following binding: options before the first positional are globals.
7. Preceding binding: options after the last positional are in `globalOptions`.

### Option shapes
8. Flag option with no value is preserved as `--flag`.
9. Value option with space-separated value is preserved as `['--opt', 'value']`.
10. Value option with inline `--opt=value` is preserved as `['--opt=value']`.
11. Value option with inline `--opt=` (empty) is preserved as `['--opt=']`.
12. Short flag `-x` is preserved.
13. Short value option `-x v` is preserved as `['-x', 'v']`.
14. Short value option `-x=v` is preserved as `['-x=v']`.
15. Aliases: an option with multiple long names is recognized under each.

### Errors
16. Unknown long option throws.
17. Unknown short option throws.
18. Missing required value throws.
19. Flag given a value via `--flag=x` throws.
20. Duplicate registration throws.
21. Invalid registered long name throws.
22. Invalid registered short name throws.

### Special tokens
23. `--` terminates option parsing; everything after is positional.
24. `--` in the middle of a group passes through cleanly (no orphan empty group).
25. `-5` is a positional by default.
26. `-5` is the registered short option when `{ short: '5' }` is defined.
27. `-3.14` is a positional.
28. `-1e9` is a positional.
29. `-.5` is a positional.
30. `-.help` throws as unknown option (not matched by the number heuristic).

### Repetition preservation
31. Repeated flags appear multiple times in the group.
32. Repeated value options appear multiple times in the group.
33. Option order within a group is preserved.

## File layout

```
args/
  SPEC.md                    # this document
  README.md                  # user-facing overview + install/usage
  src/
    groupArgs.ts             # main export
    tokenizer.ts             # internal: token classification, negative-number heuristic
    validation.ts            # internal: option-definition validation at registration time
    types/
      Binding.ts
      OptionDefinition.ts
      GroupArgsOptions.ts
      ArgGroup.ts
      GroupArgsResult.ts
      index.ts               # re-exports
    index.ts                 # re-exports public surface (runtime + types)
  test/
    groupArgs.test.ts        # primary test file (all behaviour tests)
    tokenizer.test.ts        # unit tests for edge cases of token classification (optional, fold into primary if small)
  deno.jsonc
  package.json
  tsconfig.json
  dprint.jsonc
```

Convention: every subproject in the axhxrx monorepo puts types in a `types/` subdirectory, one file per main type (named after the type, e.g. `OptionDefinition.ts`). Even when there are only a handful of types.

Goal: no file exceeds ~300 lines. `groupArgs.ts` itself should be well under 200.

## Dependencies

- Runtime: none.
- Dev: `@std/expect`, `@std/assert`, `typescript`, standard `@axhxrx` monorepo toolchain.

## Publishing

- JSR: `@axhxrx/args`.
- Versioning: semver, starts at `0.1.0`.
- No NPM publish; consumers of JSR get it via `deno add jsr:@axhxrx/args` or `bunx jsr add @axhxrx/args`.
