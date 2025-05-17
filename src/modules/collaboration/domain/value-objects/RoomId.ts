/**
 * Room ID Value Object
 * Represents the unique identifier of a collaboration room
 */
export class RoomId {
  private static generator: () => string = () => 
    Math.random().toString(36).substring(2, 12);
  
  private readonly id: string;
  
  private constructor(id: string) {
    this.id = id;
  }
  
  /**
   * Create RoomId from string
   * @param id ID string
   */
  public static fromString(id: string): RoomId {
    if (!id) {
      throw new Error('RoomId cannot be empty');
    }
    return new RoomId(id);
  }
  
  /**
   * Generate new RoomId
   */
  public static generate(): RoomId {
    return new RoomId(`${RoomId.generator()}`);
  }
  
  /**
   * Set ID generator function
   * @param generator Generator function
   */
  public static setGenerator(generator: () => string): void {
    RoomId.generator = generator;
  }
  
  /**
   * Check if string is a valid RoomId
   * @param id ID string to check
   */
  public static isValid(id: string): boolean {
    return !!id && typeof id === 'string' && id.length > 0;
  }
  
  /**
   * Convert to string
   */
  public toString(): string {
    return this.id;
  }
  
  /**
   * Compare two RoomId for equality
   * @param other Another RoomId
   */
  public equals(other: RoomId): boolean {
    return this.id === other.id;
  }
} 
