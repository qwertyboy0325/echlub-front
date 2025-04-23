import { v4 as uuidv4 } from 'uuid';

export class AudioNodeId {
    private constructor(private readonly value: string) {}

    static create(): AudioNodeId {
        return new AudioNodeId(uuidv4());
    }

    static fromString(value: string): AudioNodeId {
        return new AudioNodeId(value);
    }

    equals(other: AudioNodeId): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
} 