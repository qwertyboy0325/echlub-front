import { ValueObject } from '../../../../core/value-objects/ValueObject';

export enum InstrumentType {
  SYNTH = 'synth',
  SAMPLER = 'sampler',
  PLUGIN = 'plugin'
}

export interface InstrumentRefProps {
  type: InstrumentType;
  instrumentId: string;
  name: string;
  presetId?: string;
  parameters?: Record<string, any>;
}

/**
 * Instrument reference value object
 * References MIDI instruments (synths, samplers, plugins)
 */
export class InstrumentRef extends ValueObject<InstrumentRefProps> {
  constructor(props: InstrumentRefProps) {
    super(props);
  }

  public static synth(instrumentId: string, name: string, presetId?: string): InstrumentRef {
    return new InstrumentRef({
      type: InstrumentType.SYNTH,
      instrumentId,
      name,
      presetId
    });
  }

  public static sampler(instrumentId: string, name: string, presetId?: string): InstrumentRef {
    return new InstrumentRef({
      type: InstrumentType.SAMPLER,
      instrumentId,
      name,
      presetId
    });
  }

  public static plugin(instrumentId: string, name: string, presetId?: string): InstrumentRef {
    return new InstrumentRef({
      type: InstrumentType.PLUGIN,
      instrumentId,
      name,
      presetId
    });
  }

  protected validateProps(props: InstrumentRefProps): InstrumentRefProps {
    if (!props.instrumentId || props.instrumentId.trim() === '') {
      throw new Error('Instrument ID cannot be empty');
    }
    if (!props.name || props.name.trim() === '') {
      throw new Error('Instrument name cannot be empty');
    }
    if (!Object.values(InstrumentType).includes(props.type)) {
      throw new Error(`Invalid instrument type: ${props.type}`);
    }
    return props;
  }

  protected equalsCore(other: InstrumentRef): boolean {
    return this.props.type === other.props.type &&
           this.props.instrumentId === other.props.instrumentId &&
           this.props.name === other.props.name &&
           this.props.presetId === other.props.presetId;
  }

  // Business methods
  public withPreset(presetId: string): InstrumentRef {
    return new InstrumentRef({ ...this.props, presetId });
  }

  public withParameters(parameters: Record<string, any>): InstrumentRef {
    return new InstrumentRef({ ...this.props, parameters });
  }

  public isSynth(): boolean {
    return this.props.type === InstrumentType.SYNTH;
  }

  public isSampler(): boolean {
    return this.props.type === InstrumentType.SAMPLER;
  }

  public isPlugin(): boolean {
    return this.props.type === InstrumentType.PLUGIN;
  }

  // Getters
  public get type(): InstrumentType {
    return this.props.type;
  }

  public get instrumentId(): string {
    return this.props.instrumentId;
  }

  public get name(): string {
    return this.props.name;
  }

  public get presetId(): string | undefined {
    return this.props.presetId;
  }

  public get parameters(): Record<string, any> | undefined {
    return this.props.parameters;
  }
} 