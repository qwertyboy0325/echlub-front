import { injectable } from 'inversify';
import { UIEventBus } from './UIEventBus';
import { DomainEventBus } from './DomainEventBus';
import { UIEventPayload, DomainEventPayload } from './types';
import { ClipViewModel } from '../../presentation/models/ClipViewModel';

/**
 * Event Translator
 * Translates events from one type to another
 */
@injectable()
export class EventTranslator {
    constructor(
        private uiEventBus: UIEventBus,
        private domainEventBus: DomainEventBus
    ) {
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {
        // UI -> Domain 事件轉換
        this.uiEventBus.on('ui:clip:add', this.handleClipAdd.bind(this));
        this.uiEventBus.on('ui:clip:move', this.handleClipMove.bind(this));
        this.uiEventBus.on('ui:clip:delete', this.handleClipDelete.bind(this));

        // Domain -> UI 事件轉換
        this.domainEventBus.on('domain:clip:added', this.handleClipAdded.bind(this));
        this.domainEventBus.on('domain:clip:moved', this.handleClipMoved.bind(this));
        this.domainEventBus.on('domain:clip:deleted', this.handleClipDeleted.bind(this));
    }

    // UI -> Domain 事件處理器
    private handleClipAdd(payload: UIEventPayload['ui:clip:add']): void {
        const clip = new ClipViewModel(
            payload.audioUrl,
            payload.position,
            payload.duration,
            payload.position,
            `Clip ${Date.now()}`,
            undefined,
            payload.trackId
        );

        this.domainEventBus.emit('domain:clip:added', { clip });
    }

    private handleClipMove(payload: UIEventPayload['ui:clip:move']): void {
        this.domainEventBus.emit('domain:clip:moved', {
            clipId: payload.clipId,
            newStartTime: payload.newPosition,
            trackId: payload.trackId
        });
    }

    private handleClipDelete(payload: UIEventPayload['ui:clip:delete']): void {
        this.domainEventBus.emit('domain:clip:deleted', {
            clipId: payload.clipId
        });
    }

    // Domain -> UI 事件處理器
    private handleClipAdded(payload: DomainEventPayload['domain:clip:added']): void {
        // 這裡可以添加額外的 UI 更新邏輯
        console.debug('[EventTranslator] Clip added:', payload.clip);
    }

    private handleClipMoved(payload: DomainEventPayload['domain:clip:moved']): void {
        console.debug('[EventTranslator] Clip moved:', payload);
    }

    private handleClipDeleted(payload: DomainEventPayload['domain:clip:deleted']): void {
        console.debug('[EventTranslator] Clip deleted:', payload.clipId);
    }

    public dispose(): void {
        // 清理所有事件監聽器
        this.uiEventBus.removeAllListeners();
        this.domainEventBus.removeAllListeners();
    }
} 