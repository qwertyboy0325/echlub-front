export class TrackRouting {
  constructor(
    private input: string | null = null,
    private output: string | null = null
  ) {}

  getInput(): string | null {
    return this.input;
  }

  getOutput(): string | null {
    return this.output;
  }

  setInput(input: string | null): void {
    this.input = input;
  }

  setOutput(output: string | null): void {
    this.output = output;
  }

  equals(other: TrackRouting): boolean {
    return this.input === other.input && this.output === other.output;
  }

  clone(): TrackRouting {
    return new TrackRouting(this.input, this.output);
  }

  toJSON(): object {
    return {
      input: this.input,
      output: this.output
    };
  }
} 