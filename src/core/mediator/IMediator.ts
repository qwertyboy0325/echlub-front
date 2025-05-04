import { Command } from './Command';
import { Query } from './Query';
 
export interface IMediator {
  send<T>(command: Command<T>): Promise<T>;
  query<T>(query: Query<T>): Promise<T>;
} 