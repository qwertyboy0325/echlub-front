// Mock Web Audio API
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

export class GainNode {
    constructor(context: AudioContext) {
        this.context = context;
        this.gain = new AudioParam();
    }
    
    context: AudioContext;
    gain: AudioParam;
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}
}

export class DelayNode {
    constructor(context: AudioContext) {
        this.context = context;
        this.delayTime = new AudioParam();
    }
    
    context: AudioContext;
    delayTime: AudioParam;
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}
}

export class OscillatorNode {
    constructor(context: AudioContext) {
        this.context = context;
        this.frequency = new AudioParam();
        this.detune = new AudioParam();
    }
    
    context: AudioContext;
    frequency: AudioParam;
    detune: AudioParam;
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}
    
    start(when?: number): void {}
    stop(when?: number): void {}
}

export class AnalyserNode {
    constructor(context: AudioContext) {
        this.context = context;
    }
    
    context: AudioContext;
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}
}

export class AudioBufferSourceNode {
    constructor(context: AudioContext) {
        this.context = context;
        this.playbackRate = new AudioParam();
    }
    
    context: AudioContext;
    playbackRate: AudioParam;
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}
    
    start(when?: number): void {}
    stop(when?: number): void {}
}

export class AudioBuffer {
    constructor(options: AudioBufferOptions) {
        this.numberOfChannels = options.numberOfChannels;
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
}

export class AudioParam {
    value: number = 0;
    defaultValue: number = 0;
    minValue: number = -3.4028234663852886e+38;
    maxValue: number = 3.4028234663852886e+38;
}

export class AudioWorkletNode {
    constructor(context: AudioContext, processorName: string) {
        this.context = context;
        this.processorName = processorName;
        this.port = {
            postMessage: (message: any) => {
                // Mock implementation
            }
        };
    }
    
    context: AudioContext;
    processorName: string;
    port: {
        postMessage: (message: any) => void;
    };
    
    connect(destination: AudioNode): AudioNode {
        return destination;
    }
    
    disconnect(): void {}
}

// Add to global scope
global.AudioContext = AudioContext;
global.GainNode = GainNode;
global.DelayNode = DelayNode;
global.OscillatorNode = OscillatorNode;
global.AnalyserNode = AnalyserNode;
global.AudioBufferSourceNode = AudioBufferSourceNode;
global.AudioBuffer = AudioBuffer;
global.AudioParam = AudioParam;
global.AudioWorkletNode = AudioWorkletNode; 