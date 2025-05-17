export interface Query<T = void> {
  execute(): Promise<T>;
} 
