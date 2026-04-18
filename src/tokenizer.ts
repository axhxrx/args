import { ERROR_PREFIX, type OptionBehavior, type OptionRegistry } from './validation.ts';

/**
 A single classified token produced by the tokenizer.

 `option` tokens carry the raw input strings that should appear in the output — either one token (`--flag`, `--name=value`, `-x`, `-x=value`) or two tokens (`--name value`, `-x value`).

 `positional` tokens carry a single value string.
 */
export type Token =
  | { kind: 'option'; rawTokens: string[] }
  | { kind: 'positional'; value: string };

/**
 Tokens that look like negative numbers are treated as positionals rather than as options: a leading dash followed by either a digit (`-5`, `-3.14`, `-1e9`) or a dot-then-digit (`-.5`).

 The dot-then-digit form is required so mistyped options like `-.help` still surface as `Unknown option` rather than being silently accepted as a positional.

 Tokens whose first post-dash character is an explicitly-registered short option are parsed as that option — registration wins over the heuristic.
 */
const LEADING_NUMERIC_POSITIONAL_PATTERN = /^-(?:[0-9]|\.[0-9])/;

function isNumericPositional(arg: string, shortOptions: Map<string, OptionBehavior>): boolean
{
  if (arg.startsWith('--'))
  {
    return false;
  }

  if (!LEADING_NUMERIC_POSITIONAL_PATTERN.test(arg))
  {
    return false;
  }

  return !shortOptions.has(arg.charAt(1));
}

/**
 A token is option-shaped if the tokenizer would classify it as an option or the `--` terminator.

 Used to reject an option-shaped next token as a value for a required-value option. Negative-number positionals and the lone-dash positional are NOT option-shaped.
 */
function isOptionShaped(arg: string | undefined, shortOptions: Map<string, OptionBehavior>): boolean
{
  if (arg === undefined) return false;
  if (arg === '--') return true;
  if (arg === '-' || !arg.startsWith('-')) return false;
  if (isNumericPositional(arg, shortOptions)) return false;
  return true;
}

function getLongName(arg: string): string
{
  const eqIndex = arg.indexOf('=');
  return eqIndex >= 0 ? arg.slice(2, eqIndex) : arg.slice(2);
}

interface ParsedOption
{
  token: Token;
  consumesNextArg: boolean;
}

function parseLongOption(
  arg: string,
  nextArg: string | undefined,
  longOptions: Map<string, OptionBehavior>,
  shortOptions: Map<string, OptionBehavior>,
): ParsedOption
{
  const eqIndex = arg.indexOf('=');
  const name = getLongName(arg);
  const option = longOptions.get(name);

  if (!option)
  {
    throw new Error(`${ERROR_PREFIX} Unknown option: --${name}`);
  }

  if (option.requiresValue)
  {
    if (eqIndex >= 0)
    {
      // Empty inline values (`--foo=`) are accepted and emitted verbatim.
      // Consumers that want to forbid them must validate after parsing.
      return { token: { kind: 'option', rawTokens: [arg] }, consumesNextArg: false };
    }

    if (nextArg === undefined || isOptionShaped(nextArg, shortOptions))
    {
      throw new Error(`${ERROR_PREFIX} Missing value for --${name}`);
    }

    return { token: { kind: 'option', rawTokens: [arg, nextArg] }, consumesNextArg: true };
  }

  if (eqIndex >= 0)
  {
    throw new Error(`${ERROR_PREFIX} --${name} does not take a value`);
  }

  return { token: { kind: 'option', rawTokens: [arg] }, consumesNextArg: false };
}

function parseShortOption(
  arg: string,
  nextArg: string | undefined,
  shortOptions: Map<string, OptionBehavior>,
): ParsedOption
{
  // Per SPEC.md only `-x`, `-x VALUE`, and `-x=VALUE` are valid short-option
  // shapes. Attached-without-equals (`-nVALUE`) and bundling (`-abc`) are
  // explicit non-goals — reject them.
  const name = arg.charAt(1);
  const option = shortOptions.get(name);

  if (!option)
  {
    throw new Error(`${ERROR_PREFIX} Unknown option: -${name}`);
  }

  const rest = arg.slice(2);

  if (rest.length === 0)
  {
    // Plain `-x` — either a flag or a value option that consumes the next token.
    if (!option.requiresValue)
    {
      return { token: { kind: 'option', rawTokens: [arg] }, consumesNextArg: false };
    }

    if (nextArg === undefined || isOptionShaped(nextArg, shortOptions))
    {
      throw new Error(`${ERROR_PREFIX} Missing value for -${name}`);
    }

    return { token: { kind: 'option', rawTokens: [arg, nextArg] }, consumesNextArg: true };
  }

  // `-x=...` — inline value (only valid when the option requires a value).
  if (rest.startsWith('='))
  {
    if (!option.requiresValue)
    {
      throw new Error(`${ERROR_PREFIX} -${name} does not take a value`);
    }

    return { token: { kind: 'option', rawTokens: [arg] }, consumesNextArg: false };
  }

  // `-xSUFFIX` without `=` is neither a documented form nor supported bundling.
  if (option.requiresValue)
  {
    throw new Error(
      `${ERROR_PREFIX} -${name} requires a value via '-${name} VALUE' or '-${name}=VALUE' (attached values without '=' are not supported)`,
    );
  }

  throw new Error(`${ERROR_PREFIX} -${name} does not take a value`);
}

/**
 Classify each element of `argv` into an option or positional token.

 Responsibilities: negative-number heuristic, `--` terminator, long/short option parsing, and empty/missing value handling. It does NOT know about positional grouping or binding direction — that happens in `groupArgs`.
 */
export function tokenize(argv: readonly string[], registry: OptionRegistry): Token[]
{
  const { longOptions, shortOptions } = registry;
  const tokens: Token[] = [];
  let parsingOptions = true;
  let skipNext = false;

  for (let index = 0; index < argv.length; index++)
  {
    if (skipNext)
    {
      skipNext = false;
      continue;
    }

    const arg = argv[index]!;

    if (!parsingOptions)
    {
      tokens.push({ kind: 'positional', value: arg });
      continue;
    }

    if (arg === '--')
    {
      parsingOptions = false;
      continue;
    }

    if (arg === '-' || !arg.startsWith('-'))
    {
      tokens.push({ kind: 'positional', value: arg });
      continue;
    }

    if (isNumericPositional(arg, shortOptions))
    {
      tokens.push({ kind: 'positional', value: arg });
      continue;
    }

    const nextArg = argv[index + 1];
    const parsed = arg.startsWith('--')
      ? parseLongOption(arg, nextArg, longOptions, shortOptions)
      : parseShortOption(arg, nextArg, shortOptions);

    tokens.push(parsed.token);
    skipNext = parsed.consumesNextArg;
  }

  return tokens;
}
