import { injectable, inject, LazyServiceIdentifier } from 'inversify';
import { TYPES } from './di/types';
import { EventEmitter } from './events/EventEmitter';
import type { ClipRepository } from '../domain/repositories/ClipRepository';
import type { AudioEngine } from '../domain/audio/AudioEngine';
import type { Clip } from '../domain/models/Clip';
import { TrackPresenter } from '../presentation/presenters/TrackPresenter';

/**
 * DAW 管理器
 * 負責管理音頻片段和播放狀態
 */
@injectable()
export class DAWManager extends EventEmitter {
    private clips: Map<string, Clip> = new Map();
    private isPlaying: boolean = false;
    private currentPosition: number = 0;

    constructor(
        @inject(TYPES.ClipRepository) private clipRepository: ClipRepository,
        @inject(TYPES.AudioEngine) private audioEngine: AudioEngine,
        @inject(new LazyServiceIdentifier(() => TYPES.TrackPresenter)) 
        private trackPresenter: TrackPresenter
    ) {
        super();
    }

    /**
     * 添加音頻片段
     */
    public addClip(clip: Clip): void {
        this.clipRepository.save(clip);
        this.clips.set(clip.id, clip);
        this.emit('onAddClip', clip);
    }

    /**
     * 移除音頻片段
     */
    public removeClip(clipId: string): void {
        this.clipRepository.delete(clipId);
        this.clips.delete(clipId);
        this.emit('onRemoveClip', clipId);
    }

    /**
     * 更新音頻片段
     */
    public updateClip(clip: Clip): void {
        this.clips.set(clip.id, clip);
        this.clipRepository.save(clip);
        this.emit('onUpdateClip', clip);
    }

    /**
     * 獲取所有音頻片段
     */
    public getClips(): Clip[] {
        return Array.from(this.clips.values());
    }

    /**
     * 開始播放
     */
    public togglePlayback(): void {
        this.isPlaying = !this.isPlaying;
        this.emit('onPlaybackStateChange', this.isPlaying);
    }

    /**
     * 設置播放位置
     */
    public movePlayhead(position: number): void {
        this.currentPosition = position;
        this.emit('onPlayheadMove', position);
    }

    /**
     * 獲取當前播放位置
     */
    public getPosition(): number {
        return this.currentPosition;
    }

    /**
     * 獲取播放狀態
     */
    public isPlayingState(): boolean {
        return this.isPlaying;
    }

    /**
     * 銷毀 DAW 管理器
     */
    public destroy(): void {
        this.removeAllListeners();
        this.clips.clear();
    }

    public async initialize(): Promise<void> {
        console.log('[DAWManager] Initializing DAW');
        
        // 使用 public 方法來初始化
        await this.trackPresenter.initializePresenter();
        
        console.log('[DAWManager] DAW initialized');
    }

    public dispose(): void {
        console.log('[DAWManager] Disposing DAW');
        this.trackPresenter.disposePresenter();
    }
} 