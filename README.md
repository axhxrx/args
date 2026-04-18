# `@axhxrx/args`

Positional-anchored CLI argument tokenizer.

Standard POSIX argument parsers tend to assume one flat option namespace, plus a sequence of positionals. That doesn't fit CLIs where some options apply to a specific positional:

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

# Bun or Node
bunx jsr add @axhxrx/args
```

## Usage

```ts
import { flag, groupArgs, valueOption } from '@axhxrx/args'

const result = groupArgs(
  ['--verbose', 'pos1', '--retry', '3', 'pos2', '--status', '200'],
  {
    binding: 'following',
    options: [
      flag('verbose'),
      valueOption('retry', 'r'),
      valueOption('status'),
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

`flag()` and `valueOption()` are thin constructors for the `OptionDefinition` object — the first name is the primary, additional names are aliases, single-character names register as short options. Object literals still work if you want full control:

```ts
options: [
  { long: 'verbose' },
  { long: 'retry', short: 'r', requiresValue: true },
  { long: 'status', requiresValue: true },
]
```

### Binding

- `'following'` (default): options after a positional argument bind to it; options before the first positional argument are globals.
- `'preceding'`: options before a positional argument bind to it; trailing options after the last positional argument go to `globalOptions`.

### Vocabulary

See [GLOSSARY.md](./GLOSSARY.md) for the library's terminology — **flag**, **value option**, **value**, **positional argument**, **argument terminator** — and how it maps to POSIX and to the modern CLI folklore.

## Development

### Deno

```sh
bun install
deno install
bun test              # run tests with Bun
deno test -A          # run tests with Deno
node --test           # run tests with Node 24.2+
bun tsc --noEmit      # typecheck
dprint fmt            # format
```
