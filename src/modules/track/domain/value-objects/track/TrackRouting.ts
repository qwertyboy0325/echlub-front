import { IValueObject } from '../../interfaces/IValueObject';

export class TrackRouting implements IValueObject {
  private input: string | null;
  private output: string | null;

  constructor(input: string | null, output: string | null) {
    if (input === undefined || output === undefined) {
      throw new Error('Routing input and output must be explicitly provided (use null for no value)');
    }
    this.input = input;
    this.output = output;
  }

  getInput(): string | null {
    return this.input;
  }

  getOutput(): string | null {
    return this.output;
  }

  setInput(input: string | null): void {
    if (input === undefined) {
      throw new Error('Input must be explicitly provided (use null for no value)');
    }
    this.input = input;
  }

  setOutput(output: string | null): void {
    if (output === undefined) {
      throw new Error('Output must be explicitly provided (use null for no value)');
    }
    this.output = output;
  }

  equals(other: TrackRouting): boolean {
    if (!(other instanceof TrackRouting)) return false;
    return this.input === other.input && this.output === other.output;
  }

  clone(): TrackRouting {
    return new TrackRouting(this.input, this.output);
  }

  toString(): string {
    return `${this.input || 'null'} -> ${this.output || 'null'}`;
  }

  toJSON() {
    return {
      input: this.input,
      output: this.output
    };
  }
} 