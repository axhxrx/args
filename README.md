# `@axhxrx/args`

Positional-argument-anchored CLI argument tokenizer.

Most POSIX argument parsers tend to assume one flat option namespace, plus a sequence of positional argumentss. That doesn't fit CLIs where most options apply to a specific positional argument:

```sh
my-tool --verbose \
  "task A" --url http://a --timeout 10 \
  "task B" --url http://b --retries 3
```



`@axhxrx/args` slices `argv` into positional-anchored groups and leaves semantic interpretation (option value types, validation, mutual exclusion rules) to the caller.


## Install

```bash
# Deno
deno add jsr:@axhxrx/args

# Bun / Node
bunx jsr add @axhxrx/args
```

## Quick start

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

## Tests

```bash
bun test
deno test
node --test
```

## Runtimes

Deno, Bun, Node 24.2+

## License

MIT

## Happenings

- 2026-04-18 🩹 0.1.1 — terminology

- 2026-04-18 📦 0.1.0 — initial release

以上
