import { injectable, inject } from 'inversify';
import * as PIXI from 'pixi.js';
import { TYPES } from '../../core/di/types';
import { StateManager } from '../../core/state/StateManager';
import { PerformanceMonitor } from '../../core/monitoring/PerformanceMonitor';
import { TransportBar } from './TransportBar';
import { TimelineGrid } from './TimelineGrid';
import { TrackArea } from './TrackArea';
import { Playhead } from './Playhead';
import { BottomControls } from './BottomControls';
import { TopBar } from './TopBar';

export interface DAWRendererConfig {
    width: number;
    height: number;
    backgroundColor: number;
    bpm: number;
}

@injectable()
export class DAWRenderer {
    private app: PIXI.Application;
    private mainContainer: PIXI.Container;
    private topBar: TopBar;
    private transportBar: TransportBar;
    private timelineGrid: TimelineGrid;
    private trackArea: TrackArea;
    private playhead: Playhead;
    private bottomControls: BottomControls;
    
    constructor(
        private canvas: HTMLCanvasElement,
        @inject(TYPES.StateManager) private stateManager: StateManager,
        @inject(TYPES.PerformanceMonitor) private performanceMonitor: PerformanceMonitor,
        config?: Partial<DAWRendererConfig>
    ) {
        const defaultConfig: DAWRendererConfig = {
            width: 1200,
            height: 800,
            backgroundColor: 0x1a1a1a,
            bpm: 120
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        this.app = new PIXI.Application({
            view: canvas,
            width: finalConfig.width,
            height: finalConfig.height,
            backgroundColor: finalConfig.backgroundColor,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        });
        
        this.mainContainer = new PIXI.Container();
        this.app.stage.addChild(this.mainContainer);
        
        this.initializeComponents();
        this.setupEventListeners();
        this.setupStateSubscription();
    }
    
    private initializeComponents(): void {
        this.topBar = new TopBar();
        this.transportBar = new TransportBar();
        this.timelineGrid = new TimelineGrid();
        this.trackArea = new TrackArea();
        this.playhead = new Playhead();
        this.bottomControls = new BottomControls();
        
        this.mainContainer.addChild(
            this.topBar,
            this.transportBar,
            this.timelineGrid,
            this.trackArea,
            this.playhead,
            this.bottomControls
        );
        
        this.drawSeparators();
    }
    
    private setupEventListeners(): void {
        window.addEventListener('resize', this.handleResize);
        this.app.ticker.add(this.handleTick);
    }
    
    private setupStateSubscription(): void {
        this.stateManager.subscribe(state => {
            this.updateUIFromState(state);
        });
    }
    
    private updateUIFromState(state: any): void {
        // 更新軌道區域
        this.trackArea.updateTracks(state.tracks);
        
        // 更新播放頭位置
        this.playhead.updatePosition(state.transport.currentTime);
        
        // 更新時間軸縮放
        this.timelineGrid.updateZoom(state.timeline.zoom);
        
        // 更新時間軸滾動位置
        this.timelineGrid.updateScrollPosition(state.timeline.scrollPosition);
    }
    
    private handleTick = (delta: number): void => {
        this.performanceMonitor.recordFrame();
        this.performanceMonitor.recordMemoryUsage();
    };
    
    private handleResize = (): void => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.app.renderer.resize(width, height);
        this.updateLayout(width, height);
    };
    
    private updateLayout(width: number, height: number): void {
        // 更新各個組件的位置和大小
        this.topBar.resize(width);
        this.transportBar.resize(width);
        this.timelineGrid.resize(width);
        this.trackArea.resize(width, height);
        this.playhead.resize(width);
        this.bottomControls.resize(width);
    }
    
    private drawSeparators(): void {
        // 繪製分隔線
        const separator = new PIXI.Graphics();
        separator.lineStyle(1, 0x333333);
        separator.moveTo(0, 50);
        separator.lineTo(this.app.screen.width, 50);
        this.mainContainer.addChild(separator);
    }
    
    public destroy(): void {
        window.removeEventListener('resize', this.handleResize);
        this.app.ticker.remove(this.handleTick);
        this.app.destroy(true);
    }
} 