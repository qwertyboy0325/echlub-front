/**
 * Command Handler Interface
 * @template TCommand The type of command this handler can handle
 * @template TResult The type of result this handler returns
 */
export interface ICommandHandler<TCommand, TResult = void> {
  /**
   * Handle a command
   * @param command The command to handle
   * @returns A promise that resolves to the result of handling the command
   */
  handle(command: TCommand): Promise<TResult>;
} 