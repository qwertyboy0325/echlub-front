import { interfaces } from 'inversify';
import { useContext } from 'react';
import { container } from './container';

/**
 * 依賴注入 Hook
 * @param identifier 依賴標識符
 * @returns 注入的依賴實例
 */
export function useInjection<T>(identifier: interfaces.ServiceIdentifier<T>): T {
  return container.get<T>(identifier);
} 