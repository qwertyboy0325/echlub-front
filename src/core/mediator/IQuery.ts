/**
 * Query Interface
 * @template TResult The type of result returned by the query
 */
export interface IQuery<TResult> {
  readonly type: string;
} 