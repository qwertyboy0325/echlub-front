import * as PIXI from 'pixi.js';
import { DAWInteractionEvent, DAWInteractionType } from './types';

export class DAWInteractionManager {
  private app: PIXI.Application;
  private callback: ((event: DAWInteractionEvent) => void) | null = null;
  private isDragging = false;
  private dragStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private selectedObjects: Set<string> = new Set();

  constructor(app: PIXI.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const stage = this.app.stage;
    
    // Make stage interactive
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    // Mouse events
    stage.on('pointerdown', this.onPointerDown.bind(this));
    stage.on('pointermove', this.onPointerMove.bind(this));
    stage.on('pointerup', this.onPointerUp.bind(this));
    stage.on('rightclick', this.onRightClick.bind(this));

    // Keyboard events (need to listen on window)
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    const globalPos = event.global;
    this.isDragging = true;
    this.dragStartPosition = { x: globalPos.x, y: globalPos.y };

    // Emit canvas clicked event
    this.emitEvent('CANVAS_CLICKED', {
      position: { x: globalPos.x, y: globalPos.y },
      modifiers: this.getModifiers(event)
    });
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    const globalPos = event.global;

    if (this.isDragging) {
      const deltaX = globalPos.x - this.dragStartPosition.x;
      const deltaY = globalPos.y - this.dragStartPosition.y;

      // Only emit drag events if we've moved a minimum distance
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        this.emitEvent('VIEWPORT_CHANGED', {
          position: { x: globalPos.x, y: globalPos.y },
          delta: { x: deltaX, y: deltaY },
          modifiers: this.getModifiers(event)
        });
      }
    }

    // Always emit cursor position for collaborators
    this.emitEvent('COLLABORATOR_CURSOR_MOVED', {
      position: { x: globalPos.x, y: globalPos.y }
    });
  }

  private onPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      
      const globalPos = event.global;
      const deltaX = globalPos.x - this.dragStartPosition.x;
      const deltaY = globalPos.y - this.dragStartPosition.y;

      // If it was just a click (no significant movement)
      if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) {
        this.handleClick(event);
      }
    }
  }

  private onRightClick(event: PIXI.FederatedPointerEvent): void {
    const globalPos = event.global;
    
    this.emitEvent('CANVAS_RIGHT_CLICKED', {
      position: { x: globalPos.x, y: globalPos.y },
      modifiers: this.getModifiers(event)
    });
  }

  private handleClick(event: PIXI.FederatedPointerEvent): void {
    const target = event.target;
    const globalPos = event.global;

    // Check if we clicked on a specific DAW element
    if (target && target !== this.app.stage) {
      const targetData = (target as any).dawData;
      
      if (targetData) {
        this.handleDAWElementClick(targetData, event);
        return;
      }
    }

    // Default canvas click
    this.emitEvent('CANVAS_CLICKED', {
      position: { x: globalPos.x, y: globalPos.y },
      modifiers: this.getModifiers(event)
    });
  }

  private handleDAWElementClick(dawData: any, event: PIXI.FederatedPointerEvent): void {
    const globalPos = event.global;
    const modifiers = this.getModifiers(event);

    switch (dawData.type) {
      case 'clip':
        this.emitEvent('CLIP_SELECTED', {
          clipId: dawData.id,
          position: { x: globalPos.x, y: globalPos.y },
          modifiers
        });
        break;

      case 'track':
        this.emitEvent('TRACK_SELECTED', {
          trackId: dawData.id,
          position: { x: globalPos.x, y: globalPos.y },
          modifiers
        });
        break;

      case 'playhead':
        this.emitEvent('PLAYHEAD_DRAGGED', {
          timePosition: dawData.timePosition,
          position: { x: globalPos.x, y: globalPos.y },
          modifiers
        });
        break;

      default:
        this.emitEvent('CANVAS_CLICKED', {
          position: { x: globalPos.x, y: globalPos.y },
          modifiers
        });
        break;
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    const modifiers = {
      shift: event.shiftKey,
      ctrl: event.ctrlKey || event.metaKey,
      alt: event.altKey,
      meta: event.metaKey
    };

    // Common DAW shortcuts
    if (modifiers.ctrl) {
      switch (event.code) {
        case 'KeyC':
          // Copy
          event.preventDefault();
          break;
        case 'KeyV':
          // Paste
          event.preventDefault();
          break;
        case 'KeyZ':
          // Undo
          event.preventDefault();
          break;
        case 'KeyY':
          // Redo
          event.preventDefault();
          break;
      }
    }

    // Space bar for play/pause
    if (event.code === 'Space') {
      event.preventDefault();
      this.emitEvent('TIMELINE_SCRUBBED', {
        modifiers
      });
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    // Handle key releases if needed
  }

  private getModifiers(event: PIXI.FederatedPointerEvent): any {
    return {
      shift: event.shiftKey || false,
      ctrl: event.ctrlKey || false,
      alt: event.altKey || false,
      meta: event.metaKey || false
    };
  }

  private emitEvent(type: DAWInteractionType, payload: any): void {
    if (this.callback) {
      const event: DAWInteractionEvent = {
        type,
        timestamp: Date.now(),
        payload
      };
      
      this.callback(event);
    }
  }

  public setCallback(callback: (event: DAWInteractionEvent) => void): void {
    this.callback = callback;
  }

  public update(): void {
    // Update any ongoing interactions or animations
  }

  public destroy(): void {
    // Remove event listeners
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
    
    // Clear callback
    this.callback = null;
  }
} 