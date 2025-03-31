// Mock Web Audio API
export class AudioNode {
    constructor(context: AudioContext) {
        this.context = context;
        this.onended = null;
    }
    
    context: AudioContext;
    numberOfInputs: number = 1;
    numberOfOutputs: number = 1;
    channelCount: number = 2;
    channelCountMode: ChannelCountMode = 'max';
    channelInterpretation: ChannelInterpretation = 'speakers';
    onended: ((this: AudioNode, ev: Event) => any) | null;
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}

    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {}
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {}
    dispatchEvent(event: Event): boolean { return true; }
}

export class AudioContext {
    constructor(options?: AudioContextOptions) {
        this.sampleRate = options?.sampleRate || 44100;
        this.state = 'suspended';
        this.baseLatency = 0;
        this.outputLatency = 0;
        this.audioWorklet = {
            addModule: async (url: string) => {
                // Mock implementation
                return Promise.resolve();
            }
        };
    }
    
    sampleRate: number;
    state: AudioContextState;
    baseLatency: number;
    outputLatency: number;
    audioWorklet: {
        addModule: (url: string) => Promise<void>;
    };
    
    createGain(): GainNode {
        return new GainNode(this);
    }
    
    createDelay(): DelayNode {
        return new DelayNode(this);
    }
    
    createOscillator(): OscillatorNode {
        return new OscillatorNode(this);
    }
    
    createAnalyser(): AnalyserNode {
        return new AnalyserNode(this);
    }
    
    createBufferSource(): AudioBufferSourceNode {
        return new AudioBufferSourceNode(this);
    }
    
    createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
        return new AudioBuffer({
            numberOfChannels,
            length,
            sampleRate
        });
    }
    
    resume(): Promise<void> {
        this.state = 'running';
        return Promise.resolve();
    }
    
    suspend(): Promise<void> {
        this.state = 'suspended';
        return Promise.resolve();
    }
    
    close(): Promise<void> {
        this.state = 'closed';
        return Promise.resolve();
    }
}

export class GainNode extends AudioNode {
    constructor(context: AudioContext) {
        super(context);
        this.gain = new AudioParam();
    }
    
    gain: AudioParam;
}

export class DelayNode extends AudioNode {
    constructor(context: AudioContext) {
        super(context);
        this.delayTime = new AudioParam();
    }
    
    delayTime: AudioParam;
}

export class OscillatorNode extends AudioNode {
    constructor(context: AudioContext) {
        super(context);
        this.frequency = new AudioParam();
        this.detune = new AudioParam();
        this.type = 'sine';
    }
    
    frequency: AudioParam;
    detune: AudioParam;
    type: OscillatorType;
    
    start(when?: number): void {}
    stop(when?: number): void {}
    setPeriodicWave(wave: PeriodicWave): void {}
}

export class AnalyserNode extends AudioNode {
    constructor(context: AudioContext) {
        super(context);
        this.fftSize = 2048;
        this.frequencyBinCount = this.fftSize / 2;
        this.maxDecibels = -30;
        this.minDecibels = -100;
        this.smoothingTimeConstant = 0.8;
    }
    
    fftSize: number;
    frequencyBinCount: number;
    maxDecibels: number;
    minDecibels: number;
    smoothingTimeConstant: number;
    
    getByteFrequencyData(array: Uint8Array): void {}
    getByteTimeDomainData(array: Uint8Array): void {}
    getFloatFrequencyData(array: Float32Array): void {}
    getFloatTimeDomainData(array: Float32Array): void {}
}

export class AudioBufferSourceNode extends AudioNode {
    constructor(context: AudioContext) {
        super(context);
        this.playbackRate = new AudioParam();
        this.detune = new AudioParam();
        this.loop = false;
        this.loopStart = 0;
        this.loopEnd = 0;
    }
    
    buffer: AudioBuffer | null = null;
    playbackRate: AudioParam;
    detune: AudioParam;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    
    start(when?: number): void {}
    stop(when?: number): void {}
}

export class AudioBuffer {
    constructor(options: AudioBufferOptions) {
        this.numberOfChannels = options.numberOfChannels || 1;
        this.length = options.length;
        this.sampleRate = options.sampleRate;
        this.duration = this.length / this.sampleRate;
    }
    
    numberOfChannels: number;
    length: number;
    sampleRate: number;
    duration: number;
    
    getChannelData(channel: number): Float32Array {
        return new Float32Array(this.length);
    }
    
    copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void {}
    copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void {}
}

export class AudioParam {
    value: number = 0;
    defaultValue: number = 0;
    minValue: number = -3.4028234663852886e+38;
    maxValue: number = 3.4028234663852886e+38;
    automationRate: AutomationRate = 'a-rate';
    
    cancelAndHoldAtTime(cancelTime: number): AudioParam {
        return this;
    }
    
    cancelScheduledValues(cancelTime: number): AudioParam {
        return this;
    }
    
    exponentialRampToValueAtTime(value: number, endTime: number): AudioParam {
        return this;
    }
    
    linearRampToValueAtTime(value: number, endTime: number): AudioParam {
        return this;
    }
    
    setTargetAtTime(target: number, startTime: number, timeConstant: number): AudioParam {
        return this;
    }
    
    setValueAtTime(value: number, startTime: number): AudioParam {
        return this;
    }
    
    setValueCurveAtTime(values: number[], startTime: number, duration: number): AudioParam {
        return this;
    }
}

export class AudioWorkletNode extends AudioNode {
    constructor(context: AudioContext, processorName: string) {
        super(context);
        this.processorName = processorName;
        this.port = {
            postMessage: (message: any) => {
                // Mock implementation
            }
        };
        this.parameters = new Map();
        this.onprocessorerror = null;
    }
    
    processorName: string;
    port: {
        postMessage: (message: any) => void;
    };
    parameters: Map<string, AudioParam>;
    onprocessorerror: ((this: AudioWorkletNode, ev: Event) => any) | null;
}

// Add to global scope
(global as any).AudioContext = AudioContext;
(global as any).GainNode = GainNode;
(global as any).DelayNode = DelayNode;
(global as any).OscillatorNode = OscillatorNode;
(global as any).AnalyserNode = AnalyserNode;
(global as any).AudioBufferSourceNode = AudioBufferSourceNode;
(global as any).AudioBuffer = AudioBuffer;
(global as any).AudioParam = AudioParam;
(global as any).AudioWorkletNode = AudioWorkletNode; 