/**
 One positional argument bundled with the option tokens that belong to it.

 The `options` array contains raw tokens in the order they appeared in the input, including space-separated value forms (two tokens) and inline forms (`--name=value`, one token).
 */
export interface ArgGroup
{
  positional: string;
  options: string[];
}
