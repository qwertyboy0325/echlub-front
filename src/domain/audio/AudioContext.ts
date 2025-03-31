import { IAudioContext } from '../../core/di/types';

export class CustomAudioContext implements IAudioContext {
  private context: AudioContext;

  constructor() {
    this.context = new AudioContext();
  }

  onInit(): void {
    // No initialization needed
  }

  onDestroy(): void {
    this.context.close();
  }

  getContext(): AudioContext | null {
    return this.context;
  }

  async resume(): Promise<void> {
    await this.context.resume();
  }

  async suspend(): Promise<void> {
    await this.context.suspend();
  }

  async close(): Promise<void> {
    await this.context.close();
  }

  createAnalyser(): AnalyserNode {
    return this.context.createAnalyser();
  }

  createBiquadFilter(): BiquadFilterNode {
    return this.context.createBiquadFilter();
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
    return this.context.createBuffer(numberOfChannels, length, sampleRate);
  }

  createBufferSource(): AudioBufferSourceNode {
    return this.context.createBufferSource();
  }

  createChannelMerger(numberOfInputs?: number): ChannelMergerNode {
    return this.context.createChannelMerger(numberOfInputs);
  }

  createChannelSplitter(numberOfOutputs?: number): ChannelSplitterNode {
    return this.context.createChannelSplitter(numberOfOutputs);
  }

  createConstantSource(): ConstantSourceNode {
    return this.context.createConstantSource();
  }

  createConvolver(): ConvolverNode {
    return this.context.createConvolver();
  }

  createDelay(maxDelayTime?: number): DelayNode {
    return this.context.createDelay(maxDelayTime);
  }

  createDynamicsCompressor(): DynamicsCompressorNode {
    return this.context.createDynamicsCompressor();
  }

  createGain(): GainNode {
    return this.context.createGain();
  }

  createIIRFilter(feedforward: number[], feedback: number[]): IIRFilterNode {
    return this.context.createIIRFilter(feedforward, feedback);
  }

  createOscillator(): OscillatorNode {
    return this.context.createOscillator();
  }

  createPanner(): PannerNode {
    return this.context.createPanner();
  }

  createPeriodicWave(real: number[], imag: number[], constraints?: PeriodicWaveConstraints): PeriodicWave {
    return this.context.createPeriodicWave(real, imag, constraints);
  }

  createScriptProcessor(bufferSize?: number, inputChannels?: number, outputChannels?: number): ScriptProcessorNode {
    return this.context.createScriptProcessor(bufferSize, inputChannels, outputChannels);
  }

  createStereoPanner(): StereoPannerNode {
    return this.context.createStereoPanner();
  }

  createWaveShaper(): WaveShaperNode {
    return this.context.createWaveShaper();
  }

  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer> {
    return this.context.decodeAudioData(audioData);
  }

  get destination(): AudioDestinationNode {
    return this.context.destination;
  }

  get currentTime(): number {
    return this.context.currentTime;
  }

  get sampleRate(): number {
    return this.context.sampleRate;
  }

  get state(): AudioContextState {
    return this.context.state;
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    this.context.addEventListener(type, listener, options);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    this.context.removeEventListener(type, listener, options);
  }

  dispatchEvent(event: Event): boolean {
    return this.context.dispatchEvent(event);
  }

  get onstatechange(): ((this: BaseAudioContext, ev: Event) => any) | null {
    return this.context.onstatechange as ((this: BaseAudioContext, ev: Event) => any) | null;
  }

  set onstatechange(value: ((this: BaseAudioContext, ev: Event) => any) | null) {
    this.context.onstatechange = value;
  }

  get audioWorklet(): AudioWorklet {
    return this.context.audioWorklet;
  }

  get baseLatency(): number {
    return this.context.baseLatency;
  }

  get outputLatency(): number {
    return this.context.outputLatency;
  }

  createMediaElementSource(mediaElement: HTMLMediaElement): MediaElementAudioSourceNode {
    return this.context.createMediaElementSource(mediaElement);
  }

  createMediaStreamDestination(): MediaStreamAudioDestinationNode {
    return this.context.createMediaStreamDestination();
  }

  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode {
    return this.context.createMediaStreamSource(stream);
  }

  createMediaStreamTrackSource(track: MediaStreamTrack): MediaStreamAudioSourceNode {
    return this.context.createMediaStreamSource(new MediaStream([track]));
  }

  get listener(): AudioListener {
    return this.context.listener;
  }
} 