import type { Binding } from './Binding.ts';
import type { OptionDefinition } from './OptionDefinition.ts';

/**
 Options controlling how `groupArgs` tokenises and groups an argv array.

 `binding` defaults to `'following'`. `options` defaults to `[]` — with no registered options any option-shaped token causes an `Unknown option` error.
 */
export interface GroupArgsOptions
{
  binding?: Binding;
  options?: OptionDefinition[];
}
