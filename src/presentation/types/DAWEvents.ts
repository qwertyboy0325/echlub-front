import { Clip } from '../../domain/models/Clip';

/**
 * DAW 事件類型定義
 */
export interface DAWEvents {
    /**
     * 當添加新的音頻片段時觸發
     */
    onAddClip: (clip: Clip) => void;

    /**
     * 當移除音頻片段時觸發
     */
    onRemoveClip: (clipId: string) => void;

    /**
     * 當更新音頻片段時觸發
     */
    onUpdateClip: (clip: Clip) => void;

    /**
     * 當播放位置改變時觸發
     */
    onPlayheadMove: (position: number) => void;

    /**
     * 當播放狀態改變時觸發
     */
    onPlaybackStateChange: (isPlaying: boolean) => void;
}

/**
 * DAW 事件監聽器類型
 */
export type DAWEventListener<T extends keyof DAWEvents> = (data: Parameters<DAWEvents[T]>[0]) => void; 