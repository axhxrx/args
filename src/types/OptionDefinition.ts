/**
 Declarative definition of a single option.

 At least one of `long` or `short` must be provided. Either may be a single string or an array of strings for aliases — every alias is recognised at parse time.

 Long names must match `[A-Za-z][A-Za-z0-9_-]*`. Short names must match `[A-Za-z0-9]`.
 */
export interface OptionDefinition
{
  /**
   Long option names without leading dashes. A string or array of aliases.
   */
  long?: string | readonly string[];

  /**
   Short option names without leading dashes. Each entry must be exactly one character.
   */
  short?: string | readonly string[];

  /**
   Whether the option consumes a required value. Defaults to `false` (a flag).
   */
  requiresValue?: boolean;
}
