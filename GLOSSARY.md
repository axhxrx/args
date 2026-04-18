# `@axhxrx/args` Glossary

👨‍🍳 Chef's notes: I comissioned this ludicrously detailed summary of the terminology involved here, which probably eclipses the total source code in length, from Claudeさん because... I mean, a trivial library like this is not maybe the right place to keep important information, but this actually keeps coming up, in various projects.

Is it _args_, _options_, _flags_, _value options_, _positional arguments_, ...?¿¿¿€¿??

Turns out, it's apparently because the POSIX terminology is ambiguous bullshit! Who'da thunk it? 

I also don't think I had anything to do with the selection of "folklore" as the label for prevailing-but-not-based-on-much terms. Claudeさん pulled that one out of his own bot ass. But I like it! 👏

So without further ado, or revision, I'll let the automaton make the case. This does explain the terminology used by this library, but I can't vouch for historical accuracy — I can only say that it passes my own smell test, so I went with it.

---

Vocabulary used throughout this library's source, tests, error messages, and docs. Based on POSIX *Utility Conventions* (IEEE Std 1003.1 §12) where the canonical term is clear, and on the most-consistent modern CLI folklore where POSIX left the naming ambiguous.

## Core terms

| Term | Definition | Example |
|---|---|---|
| **argument** | Any token in `argv`. Deliberately rarely used alone — too vague. Prefer a more specific term below. | `--url`, `http://x`, `file.txt` |
| **option** | Any token that begins with `-` or `--` and names behaviour rather than data. Also rarely used alone — usually qualified as **flag** or **value option**. | `-v`, `--retry`, `--url http://x` |
| **flag** | An option that takes no value. Its presence alone is the signal. | `-v`, `--verbose`, `--dry-run` |
| **value option** | An option that requires a value. | `--url http://x`, `--retry=3`, `-n 5` |
| **value** | The token bound to a value option. | `http://x` in `--url http://x` |
| **positional argument** | Any non-option token. Anchors groups in this library's output. | `file.txt`, `task A`, `42` |
| **argument terminator** | The literal `--`; every token after it is treated as a positional argument. | `--` in `cmd --flag -- -file.txt` |

**Principle.** Everything is an argument; almost everything that isn't a positional argument is an option. Because those two umbrella words are too vague to be useful on their own, we reach for the sub-terms (**flag**, **value option**, **value**, **positional argument**) in practice.

## Qualifiers

Cross-cutting adjectives that apply to both flags and value options:

| Term | Definition | Example |
|---|---|---|
| **long option** | An option introduced by `--`, with a multi-character name. | `--verbose`, `--retry` |
| **short option** | An option introduced by a single `-`, with a one-character name. | `-v`, `-r` |
| **alias** | An additional name registered for the same option — another long name, another short name, or the short counterpart of a long one. | `--retry` and `-r` |

## Value forms

A value option's value can appear in two forms:

| Term | Definition | Example |
|---|---|---|
| **separated value** | The value sits in its own argv token, after the option. | `--url http://x`, `-n 5` |
| **inline value** | The value is joined to the option with `=`. | `--url=http://x`, `-n=5` |

The library preserves whichever form it found — a separated value becomes two tokens in the output, an inline value stays one token.

## Library concepts

Terms used by the `groupArgs` API that aren't part of universal Unix vocabulary:

| Term | Definition |
|---|---|
| **group** | A positional argument bundled with the option tokens bound to it. `ArgGroup` in code. |
| **binding** | The rule for which options attach to which positional argument: `'following'` (options after a positional bind to it) or `'preceding'` (options before a positional bind to it). |
| **global option** | An option not bound to any positional — the leading run under `'following'` binding, or the trailing run under `'preceding'`. |

## Rationale

### Why "option" as the umbrella

POSIX uses *option* for any token introduced by `-` regardless of whether it carries a value, then distinguishes the two kinds by the predicate "takes an option-argument". That leaves the two sub-kinds without short names, which folklore filled in inconsistently — usually *flag* for the no-value kind, and either *option* (in a narrower sense) or *valued option* for the other.

We adopt the POSIX umbrella (so `OptionDefinition`, "registered option", "unknown option" all read correctly) and name the sub-kinds **flag** and **value option** — unambiguous, broadly understood, and non-overlapping.

### Why "positional argument" and not POSIX's "operand"

"Operand" is POSIX's formal term, but reads like spec-ese to most TypeScript/JavaScript audiences. "Positional argument" is widely used by argparse, clap, commander, and most modern CLI docs, and carries its own definition in its name.

Whenever clarity matters across the Unix/POSIX/folklore boundary: **operand** and **positional argument** mean the same thing.

### Why "flag" at all

POSIX doesn't define *flag* — but every modern CLI library (Go's `flag`, Rust's `clap`, Docker's docs, Git's docs) does. Without it there's no single word for "an option that's just a switch," and documentation sprawls. The minor POSIX deviation pays for itself immediately.

## POSIX ↔ folklore ↔ this library

| POSIX term | Folklore term(s) | This library |
|---|---|---|
| *argument* | argument | **argument** (rarely used alone) |
| *option* (umbrella) | option / flag (ambiguous in folklore) | **option** (umbrella, rarely used alone) |
| *option* with no option-argument | flag, switch | **flag** |
| *option* with required option-argument | option (narrow), valued option | **value option** |
| *option-argument* | value | **value** |
| *operand* | positional, positional argument | **positional argument** |
| *argument terminator* | `--`, double-dash, end-of-options | **argument terminator** |

## Terms we deliberately avoid

- **switch** — Windows-ism; redundant with **flag**.
- **parameter** — overloaded: sometimes means *operand*, sometimes *option-argument*, sometimes anything in argv.
- **argument** used alone — too vague; prefer a qualified compound (*positional argument*, *option-argument* when cross-referencing POSIX).
- **operand** in user-facing docs — correct but unfamiliar; reserved for cross-references to POSIX.
- **option** used alone when the sub-kind matters — prefer *flag* or *value option*.
- **bundled short option** (`-abc` meaning `-a -b -c`), **optional option-argument** (`--foo[=value]`), and **attached short value without `=`** (`-n5`) — all outside this library's grammar. Naming them would only create expectation mismatches.
