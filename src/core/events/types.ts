import { Track } from '../../domain/entities/Track';
import { Clip } from '../../domain/entities/Clip';
import { EventPriorityType } from './constants/EventPriority';

export interface UIEventPayload {
  // 軌道事件
  'ui:track:create': void;
  'ui:track:delete': { trackId: string };
  'ui:track:volume:change': { trackId: string; volume: number };
  'ui:track:pan:change': { trackId: string; pan: number };
  'ui:track:mute:toggle': { trackId: string };
  'ui:track:solo:toggle': { trackId: string };
  
  // 片段事件
  'ui:clip:add': { trackId: string; clip: Clip };
  'ui:clip:delete': { trackId: string; clipId: string };
  'ui:clip:select': { trackId: string; clipId: string };
  'ui:clip:position:change': { trackId: string; clipId: string; position: number };
  'ui:clip:volume:change': { trackId: string; clipId: string; volume: number };
  'ui:clip:pan:change': { trackId: string; clipId: string; pan: number };
  
  // 傳輸控制事件
  'ui:transport:play': void;
  'ui:transport:pause': void;
  'ui:transport:stop': void;
  'ui:transport:record': void;
  'ui:transport:bpm:change': { bpm: number };
  
  // 時間軸事件
  'ui:timeline:zoom:change': { zoom: number };
  'ui:timeline:scroll:change': { scrollPosition: number };
}

export interface DomainEventPayload {
  // 軌道事件
  'domain:track:created': { track: Track };
  'domain:track:deleted': { trackId: string };
  'domain:track:updated': { trackId: string; changes: Partial<Track> };
  
  // 片段事件
  'domain:clip:added': { trackId: string; clip: Clip };
  'domain:clip:deleted': { trackId: string; clipId: string };
  'domain:clip:updated': { trackId: string; clipId: string; changes: Partial<Clip> };
  'domain:clip:position:changed': { trackId: string; clipId: string; position: number };
  
  // 傳輸控制事件
  'domain:transport:state:changed': { state: 'playing' | 'paused' | 'stopped' };
  'domain:transport:bpm:changed': { bpm: number };
  
  // 時間軸事件
  'domain:timeline:zoom:changed': { zoom: number };
  'domain:timeline:scroll:changed': { scrollPosition: number };
}

export type EventPayload = UIEventPayload & DomainEventPayload;

export interface EventHandlerOptions {
  once?: boolean;
  priority?: EventPriorityType;
  retryConfig?: RetryConfig;
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

export interface EventFilter<T> {
  shouldProcess(payload: T): boolean;
} 