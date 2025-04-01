import { ClipViewModel } from '../../presentation/models/ClipViewModel';

export interface UIEventPayload {
  'ui:clip:add': {
    trackId: string;
    position: number;
    duration: number;
    audioUrl: string;
  };
  'ui:clip:move': {
    clipId: string;
    newPosition: number;
    trackId: string;
  };
  'ui:clip:delete': {
    clipId: string;
  };
  'ui:playback:start': void;
  'ui:playback:pause': void;
  'ui:playback:stop': void;
  'ui:bpm:change': {
    bpm: number;
  };
}

export interface DomainEventPayload {
  'domain:clip:added': {
    clip: ClipViewModel;
  };
  'domain:clip:moved': {
    clipId: string;
    newStartTime: number;
    trackId: string;
  };
  'domain:clip:deleted': {
    clipId: string;
  };
  'domain:playback:started': {
    time: number;
  };
  'domain:playback:paused': {
    time: number;
  };
  'domain:playback:stopped': {
    time: number;
  };
  'domain:bpm:changed': {
    bpm: number;
  };
}

export interface EventHandlerOptions {
  priority?: EventPriority;
  retryConfig?: RetryConfig;
}

export enum EventPriority {
  HIGH = 0,
  MEDIUM = 1,
  LOW = 2
}

export interface RetryConfig {
  maxAttempts: number;
  delay: number;
  backoff: number;
}

export interface EventFilter<T> {
  shouldProcess(payload: T): boolean;
} 