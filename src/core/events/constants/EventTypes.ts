/**
 * 系統事件類型
 * System event types
 */
export const SystemEventTypes = {
    INITIALIZED: 'system:initialized',
    ERROR: 'system:error',
    STATE_CHANGED: 'system:state_changed',
    CONFIG_CHANGED: 'system:config_changed'
} as const;

/**
 * 音頻事件類型
 * Audio event types
 */
export const AudioEventTypes = {
    PLAY: 'audio:play',
    PAUSE: 'audio:pause',
    STOP: 'audio:stop',
    SEEK: 'audio:seek',
    VOLUME_CHANGED: 'audio:volume_changed',
    TRACK_ADDED: 'audio:track_added',
    TRACK_REMOVED: 'audio:track_removed',
    CLIP_ADDED: 'audio:clip_added',
    CLIP_REMOVED: 'audio:clip_removed',
    PROCESSING_ERROR: 'audio:processing_error'
} as const;

/**
 * UI 事件類型
 * UI event types
 */
export const UIEventTypes = {
    TRACK_SELECTED: 'ui:track_selected',
    CLIP_SELECTED: 'ui:clip_selected',
    ZOOM_CHANGED: 'ui:zoom_changed',
    TIMELINE_SCROLLED: 'ui:timeline_scrolled',
    THEME_CHANGED: 'ui:theme_changed'
} as const;

/**
 * 專案事件類型
 * Project event types
 */
export const ProjectEventTypes = {
    CREATED: 'project:created',
    OPENED: 'project:opened',
    SAVED: 'project:saved',
    CLOSED: 'project:closed',
    SETTINGS_CHANGED: 'project:settings_changed',
    AUTOSAVE: 'project:autosave'
} as const;

export type EventType = 
    | typeof SystemEventTypes[keyof typeof SystemEventTypes]
    | typeof AudioEventTypes[keyof typeof AudioEventTypes]
    | typeof UIEventTypes[keyof typeof UIEventTypes]
    | typeof ProjectEventTypes[keyof typeof ProjectEventTypes]; 