/**
 * Command Interface
 * @template TResult The type of result returned by the command
 */
export interface ICommand<TResult = void> {
  readonly type: string;
} 