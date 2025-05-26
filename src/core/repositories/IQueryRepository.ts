/**
 * 分頁選項介面
 */
export interface IPaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * 分頁結果介面
 */
export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 排序方向
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/**
 * 排序選項介面
 */
export interface ISortOptions {
  field: string;
  direction: SortDirection;
}

/**
 * 查詢存儲庫介面
 * 專門用於查詢操作的存儲庫，遵循CQRS模式
 * @template T 實體類型
 */
export interface IQueryRepository<T> {
  /**
   * 查詢所有記錄
   * @param sort 排序選項
   */
  findAll(sort?: ISortOptions[]): Promise<T[]>;
  
  /**
   * 分頁查詢
   * @param options 分頁選項
   * @param sort 排序選項
   */
  findWithPagination(
    options: IPaginationOptions,
    sort?: ISortOptions[]
  ): Promise<IPaginatedResult<T>>;
  
  /**
   * 根據條件查詢
   * @param filter 過濾條件
   * @param sort 排序選項
   */
  findByFilter(
    filter: Record<string, any>,
    sort?: ISortOptions[]
  ): Promise<T[]>;
  
  /**
   * 根據條件分頁查詢
   * @param filter 過濾條件
   * @param options 分頁選項
   * @param sort 排序選項
   */
  findByFilterWithPagination(
    filter: Record<string, any>,
    options: IPaginationOptions,
    sort?: ISortOptions[]
  ): Promise<IPaginatedResult<T>>;
  
  /**
   * 計算符合條件的記錄總數
   * @param filter 過濾條件
   */
  count(filter?: Record<string, any>): Promise<number>;
} 