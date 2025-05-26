import { UniqueId } from '@/core/value-objects/UniqueId';
import { v4 as uuidv4 } from 'uuid';
import { validate as validateUUID } from 'uuid';

/**
 * 回合 ID 值對象
 */
export class RoundId extends UniqueId<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 創建新的回合 ID
   */
  public static create(): RoundId {
    return new RoundId(uuidv4());
  }

  /**
   * 從字串創建回合 ID
   */
  public static fromString(id: string): RoundId {
    if (!id) {
      throw new Error('Invalid UUID format');
    }
    
    if (!validateUUID(id)) {
      throw new Error('Invalid UUID format');
    }
    
    return new RoundId(id);
  }
} 