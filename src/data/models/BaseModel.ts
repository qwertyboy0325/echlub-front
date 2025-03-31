export abstract class BaseModelImpl {
  id: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  constructor() {
    this.id = this.generateUUID();
    this.version = 1;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  protected incrementVersion(): void {
    this.version++;
    this.updatedAt = new Date();
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 