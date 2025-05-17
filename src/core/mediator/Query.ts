/**
 * Base interface for query objects in the mediator pattern
 */
export interface Query<TResult> {
  readonly type: string;
  readonly _resultType?: TResult; // 只用於類型推導，不需要實際實現
} 
