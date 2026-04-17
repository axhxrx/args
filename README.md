# `@axhxrx/args`

Positional-anchored CLI argument tokenizer. See [SPEC.md](./SPEC.md) for the full behaviour contract.

## Why

Standard POSIX argument parsers assume one flat option namespace plus a sequence of positionals. That doesn't fit CLIs where some options apply to a specific positional:

```sh
my-tool --verbose \
  "task A" --url http://a --timeout 10 \
  "task B" --url http://b --retries 3
```

`@axhxrx/args` slices `argv` into positional-anchored groups and leaves semantic interpretation (option value types, validation, mutual exclusion rules) to the caller.

## Install

```sh
# Deno
deno add jsr:@axhxrx/args

# Bun
bunx jsr add @axhxrx/args
```

## Usage

```ts
import { groupArgs } from '@axhxrx/args'

const result = groupArgs(
  ['--verbose', 'pos1', '--retry', '3', 'pos2', '--status', '200'],
  {
    binding: 'following',
    options: [
      { long: 'verbose' },
      { long: 'retry', short: 'r', requiresValue: true },
      { long: 'status', requiresValue: true },
    ],
  },
)

// result === {
//   globalOptions: ['--verbose'],
//   groups: [
//     { positional: 'pos1', options: ['--retry', '3'] },
//     { positional: 'pos2', options: ['--status', '200'] },
//   ],
// }
```

### Binding

- `'following'` (default): options after a positional bind to it; options before the first positional are globals.
- `'preceding'`: options before a positional bind to it; trailing options after the last positional go to `globalOptions`.

## Development

```sh
bun install
bun test              # run tests with Bun
deno test -A          # run tests with Deno
bun tsc --noEmit      # typecheck
dprint fmt            # format
```
