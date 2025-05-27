/**
 * Simple MVP Audio Engine
 * 使用原生 Web Audio API 實現的簡化音頻引擎
 * 🎵 真正能發出聲音！無需額外依賴
 */

export interface AudioTrack {
  id: string;
  name: string;
  gainNode: GainNode;
  isPlaying: boolean;
  isMuted: boolean;
}

export class SimpleMVPAudioEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private tracks: Map<string, AudioTrack> = new Map();
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private bpm: number = 120;
  
  constructor() {
    // 創建音頻上下文
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 創建主音量控制
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.8;
    
    console.log('🎵 SimpleMVPAudioEngine initialized - Ready to make sound!');
  }
  
  /**
   * 🎵 立即播放音頻檔案
   */
  async playAudioFile(url: string, trackId: string = 'default'): Promise<void> {
    try {
      // 確保音頻上下文已啟動
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // 載入音頻檔案
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 創建音源和軌道
      const source = this.audioContext.createBufferSource();
      const trackGain = this.audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.connect(trackGain);
      trackGain.connect(this.masterGain);
      
      // 記錄軌道
      this.tracks.set(trackId, {
        id: trackId,
        name: `Audio Track ${trackId}`,
        gainNode: trackGain,
        isPlaying: true,
        isMuted: false
      });
      
      // 播放
      source.start();
      
      // 播放結束後清理
      source.onended = () => {
        const track = this.tracks.get(trackId);
        if (track) {
          track.isPlaying = false;
        }
      };
      
      console.log(`🎵 Playing audio: ${url} on track ${trackId}`);
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw new Error(`Failed to play audio file: ${error}`);
    }
  }
  
  /**
   * 🎹 播放 MIDI 音符 (簡化合成器)
   */
  playNote(frequency: number, duration: number = 1, trackId: string = 'synth'): void {
    try {
      // 確保音頻上下文已啟動
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      // 設定音符
      oscillator.frequency.value = frequency;
      oscillator.type = 'sawtooth'; // 合成器音色
      
      // 設定音量包絡 (ADSR)
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
      gainNode.gain.exponentialRampToValueAtTime(0.1, now + 0.1); // Decay
      gainNode.gain.setValueAtTime(0.1, now + 0.1); // Sustain
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
      
      // 播放
      oscillator.start(now);
      oscillator.stop(now + duration);
      
      console.log(`🎹 Playing note: ${frequency}Hz for ${duration}s on track ${trackId}`);
      
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }
  
  /**
   * 🎵 播放音符 (使用音符名稱)
   */
  playNoteByName(noteName: string, duration: number = 1, trackId: string = 'synth'): void {
    const frequency = this.noteToFrequency(noteName);
    this.playNote(frequency, duration, trackId);
  }
  
  /**
   * 🎵 播放和弦
   */
  playChord(frequencies: number[], duration: number = 2, trackId: string = 'chord'): void {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playNote(freq, duration, `${trackId}_${index}`);
      }, index * 50); // 稍微錯開時間，產生和弦效果
    });
  }
  
  /**
   * 🎵 播放預設測試音效
   */
  playTestSound(): void {
    console.log('🎵 Playing test sound - C Major Chord');
    
    // C4 大調和弦 (C-E-G-C)
    const chord = [
      261.63, // C4
      329.63, // E4
      392.00, // G4
      523.25  // C5
    ];
    
    this.playChord(chord, 3, 'test');
  }
  
  /**
   * 🎵 播放簡單旋律
   */
  playMelody(): void {
    console.log('🎵 Playing melody - Twinkle Twinkle Little Star');
    
    const melody = [
      { note: 'C4', duration: 0.5 },
      { note: 'C4', duration: 0.5 },
      { note: 'G4', duration: 0.5 },
      { note: 'G4', duration: 0.5 },
      { note: 'A4', duration: 0.5 },
      { note: 'A4', duration: 0.5 },
      { note: 'G4', duration: 1.0 }
    ];
    
    let currentTime = 0;
    melody.forEach(({ note, duration }) => {
      setTimeout(() => {
        this.playNoteByName(note, duration, 'melody');
      }, currentTime * 1000);
      currentTime += duration;
    });
  }
  
  /**
   * 🎛️ 音量控制
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.masterGain.gain.value = clampedVolume;
    console.log(`🎛️ Master volume set to ${clampedVolume}`);
  }
  
  /**
   * 🎛️ 軌道音量控制
   */
  setTrackVolume(trackId: string, volume: number): void {
    const track = this.tracks.get(trackId);
    if (track) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      track.gainNode.gain.value = clampedVolume;
      console.log(`🎛️ Track ${trackId} volume set to ${clampedVolume}`);
    }
  }
  
  /**
   * 🔇 軌道靜音
   */
  muteTrack(trackId: string, muted: boolean): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.isMuted = muted;
      track.gainNode.gain.value = muted ? 0 : 1;
      console.log(`🔇 Track ${trackId} ${muted ? 'muted' : 'unmuted'}`);
    }
  }
  
  /**
   * 🎛️ BPM 控制
   */
  setBpm(bpm: number): void {
    this.bpm = Math.max(60, Math.min(200, bpm));
    console.log(`🎛️ BPM set to ${this.bpm}`);
  }
  
  /**
   * ▶️ 開始播放
   */
  startPlayback(): void {
    this.isPlaying = true;
    console.log('▶️ Playback started');
  }
  
  /**
   * ⏹️ 停止播放
   */
  stopPlayback(): void {
    this.isPlaying = false;
    this.currentTime = 0;
    console.log('⏹️ Playback stopped');
  }
  
  /**
   * ⏸️ 暫停播放
   */
  pausePlayback(): void {
    this.isPlaying = false;
    console.log('⏸️ Playback paused');
  }
  
  /**
   * 📊 獲取狀態
   */
  getStatus(): {
    isPlaying: boolean;
    currentTime: number;
    bpm: number;
    trackCount: number;
    masterVolume: number;
  } {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      bpm: this.bpm,
      trackCount: this.tracks.size,
      masterVolume: this.masterGain.gain.value
    };
  }
  
  /**
   * 🎵 創建節拍器
   */
  startMetronome(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    const interval = 60000 / this.bpm; // 毫秒
    
    const tick = () => {
      if (!this.isPlaying) return;
      
      // 播放節拍音
      this.playNote(800, 0.1, 'metronome');
      
      setTimeout(tick, interval);
    };
    
    tick();
    console.log(`🎵 Metronome started at ${this.bpm} BPM`);
  }
  
  /**
   * 🎵 停止節拍器
   */
  stopMetronome(): void {
    this.isPlaying = false;
    console.log('🎵 Metronome stopped');
  }
  
  /**
   * 🧹 清理資源
   */
  dispose(): void {
    this.stopPlayback();
    this.tracks.clear();
    
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    console.log('🧹 SimpleMVPAudioEngine disposed');
  }
  
  // 私有輔助方法
  
  /**
   * 音符名稱轉頻率
   */
  private noteToFrequency(noteName: string): number {
    const noteMap: { [key: string]: number } = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
      'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
      'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
    };
    
    return noteMap[noteName] || 440; // 預設 A4
  }
}

// 導出便利函數
export function createMVPAudioEngine(): SimpleMVPAudioEngine {
  return new SimpleMVPAudioEngine();
}

// 快速測試函數
export async function testAudioEngine(): Promise<void> {
  const engine = new SimpleMVPAudioEngine();
  
  console.log('🎵 Testing SimpleMVPAudioEngine...');
  
  // 測試 1: 播放測試音效
  engine.playTestSound();
  
  // 測試 2: 播放旋律 (2秒後)
  setTimeout(() => {
    engine.playMelody();
  }, 2000);
  
  // 測試 3: 音量控制 (5秒後)
  setTimeout(() => {
    engine.setMasterVolume(0.3);
    engine.playNote(440, 1); // A4
  }, 5000);
  
  console.log('🎵 Audio engine test completed!');
} 