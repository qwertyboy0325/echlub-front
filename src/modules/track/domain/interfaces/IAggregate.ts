export interface IAggregate {
  getId(): string;
  getVersion(): number;
  incrementVersion(): void;
  toJSON(): object;
} 