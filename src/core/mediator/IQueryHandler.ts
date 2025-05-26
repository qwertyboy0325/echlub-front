/**
 * Query Handler Interface
 * @template TQuery The type of query to handle
 * @template TResult The type of result returned by the query
 */
export interface IQueryHandler<TQuery, TResult> {
  /**
   * Handle the query
   * @param query The query to handle
   * @returns A promise that resolves to the query result
   */
  handle(query: TQuery): Promise<TResult>;
} 