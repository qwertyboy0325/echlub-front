/**
 * Peer ID Value Object
 * Represents the unique identifier of a peer in WebRTC connections
 */
export class PeerId {
  private static generator: () => string = () => 
    Math.random().toString(36).substring(2, 15);
  
  private readonly id: string;
  
  private constructor(id: string) {
    this.id = id;
  }
  
  /**
   * Create PeerId from string
   * @param id ID string
   */
  public static fromString(id: string): PeerId {
    if (!id) {
      throw new Error('PeerId cannot be empty');
    }
    return new PeerId(id);
  }
  
  /**
   * Generate new PeerId
   */
  public static generate(): PeerId {
    return new PeerId(PeerId.generator());
  }
  
  /**
   * Generate new PeerId (alias for generate)
   */
  public static create(): PeerId {
    return PeerId.generate();
  }
  
  /**
   * Set ID generator function
   * @param generator Generator function
   */
  public static setGenerator(generator: () => string): void {
    PeerId.generator = generator;
  }
  
  /**
   * Convert to string
   */
  public toString(): string {
    return this.id;
  }
  
  /**
   * Compare two PeerIds for equality
   * @param other Another PeerId
   */
  public equals(other: PeerId): boolean {
    return this.id === other.id;
  }
} 
