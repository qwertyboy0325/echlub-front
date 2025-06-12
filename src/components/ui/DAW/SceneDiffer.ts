import { DAWSceneState, SceneDiff } from './types';

export class SceneDiffer {
  
  /**
   * Calculate the difference between old and new scene states
   */
  public calculateDiff(oldState: DAWSceneState | null, newState: DAWSceneState): SceneDiff {
    if (!oldState) {
      // First render - everything is new
      return this.createFullDiff(newState);
    }

    const diff: SceneDiff = {};

    // Compare viewport
    if (this.hasViewportChanged(oldState.viewport, newState.viewport)) {
      diff.viewport = this.getViewportDiff(oldState.viewport, newState.viewport);
    }

    // Compare timeline
    if (this.hasTimelineChanged(oldState.timeline, newState.timeline)) {
      diff.timeline = this.getTimelineDiff(oldState.timeline, newState.timeline);
    }

    // Compare tracks
    const tracksDiff = this.getTracksDiff(oldState.tracks, newState.tracks);
    if (tracksDiff.added.length > 0 || tracksDiff.removed.length > 0 || tracksDiff.updated.length > 0) {
      diff.tracks = tracksDiff;
    }

    // Compare clips
    const clipsDiff = this.getClipsDiff(oldState.clips, newState.clips);
    if (clipsDiff.added.length > 0 || clipsDiff.removed.length > 0 || clipsDiff.updated.length > 0) {
      diff.clips = clipsDiff;
    }

    // Compare playhead
    if (this.hasPlayheadChanged(oldState.playhead, newState.playhead)) {
      diff.playhead = this.getPlayheadDiff(oldState.playhead, newState.playhead);
    }

    // Compare selection
    if (this.hasSelectionChanged(oldState.selection, newState.selection)) {
      diff.selection = this.getSelectionDiff(oldState.selection, newState.selection);
    }

    // Compare collaborators
    const collaboratorsDiff = this.getCollaboratorsDiff(oldState.collaborators, newState.collaborators);
    if (collaboratorsDiff.added.length > 0 || collaboratorsDiff.removed.length > 0 || collaboratorsDiff.updated.length > 0) {
      diff.collaborators = collaboratorsDiff;
    }

    // Check redraw flags
    if (newState.shouldRedrawWaveforms !== oldState.shouldRedrawWaveforms) {
      diff.shouldRedrawWaveforms = newState.shouldRedrawWaveforms;
    }

    if (newState.shouldRedrawGrid !== oldState.shouldRedrawGrid) {
      diff.shouldRedrawGrid = newState.shouldRedrawGrid;
    }

    return diff;
  }

  private createFullDiff(newState: DAWSceneState): SceneDiff {
    return {
      viewport: newState.viewport,
      timeline: newState.timeline,
      tracks: {
        added: newState.tracks,
        removed: [],
        updated: []
      },
      clips: {
        added: newState.clips,
        removed: [],
        updated: []
      },
      playhead: newState.playhead,
      selection: newState.selection,
      collaborators: {
        added: newState.collaborators,
        removed: [],
        updated: []
      },
      shouldRedrawWaveforms: newState.shouldRedrawWaveforms,
      shouldRedrawGrid: newState.shouldRedrawGrid
    };
  }

  private hasViewportChanged(oldViewport: any, newViewport: any): boolean {
    return JSON.stringify(oldViewport) !== JSON.stringify(newViewport);
  }

  private getViewportDiff(oldViewport: any, newViewport: any): any {
    const diff: any = {};
    
    if (oldViewport.width !== newViewport.width) diff.width = newViewport.width;
    if (oldViewport.height !== newViewport.height) diff.height = newViewport.height;
    if (oldViewport.resolution !== newViewport.resolution) diff.resolution = newViewport.resolution;
    if (oldViewport.devicePixelRatio !== newViewport.devicePixelRatio) diff.devicePixelRatio = newViewport.devicePixelRatio;
    
    return diff;
  }

  private hasTimelineChanged(oldTimeline: any, newTimeline: any): boolean {
    return JSON.stringify(oldTimeline) !== JSON.stringify(newTimeline);
  }

  private getTimelineDiff(oldTimeline: any, newTimeline: any): any {
    const diff: any = {};
    
    Object.keys(newTimeline).forEach(key => {
      if (oldTimeline[key] !== newTimeline[key]) {
        diff[key] = newTimeline[key];
      }
    });
    
    return diff;
  }

  private getTracksDiff(oldTracks: any[], newTracks: any[]): any {
    const oldTracksMap = new Map(oldTracks.map(track => [track.id, track]));
    const newTracksMap = new Map(newTracks.map(track => [track.id, track]));

    const added = newTracks.filter(track => !oldTracksMap.has(track.id));
    const removed = oldTracks.filter(track => !newTracksMap.has(track.id)).map(track => track.id);
    const updated: any[] = [];

    newTracks.forEach(newTrack => {
      const oldTrack = oldTracksMap.get(newTrack.id);
      if (oldTrack && JSON.stringify(oldTrack) !== JSON.stringify(newTrack)) {
        updated.push({
          id: newTrack.id,
          changes: this.getObjectDiff(oldTrack, newTrack)
        });
      }
    });

    return { added, removed, updated };
  }

  private getClipsDiff(oldClips: any[], newClips: any[]): any {
    const oldClipsMap = new Map(oldClips.map(clip => [clip.id, clip]));
    const newClipsMap = new Map(newClips.map(clip => [clip.id, clip]));

    const added = newClips.filter(clip => !oldClipsMap.has(clip.id));
    const removed = oldClips.filter(clip => !newClipsMap.has(clip.id)).map(clip => clip.id);
    const updated: any[] = [];

    newClips.forEach(newClip => {
      const oldClip = oldClipsMap.get(newClip.id);
      if (oldClip && JSON.stringify(oldClip) !== JSON.stringify(newClip)) {
        updated.push({
          id: newClip.id,
          changes: this.getObjectDiff(oldClip, newClip)
        });
      }
    });

    return { added, removed, updated };
  }

  private hasPlayheadChanged(oldPlayhead: any, newPlayhead: any): boolean {
    return JSON.stringify(oldPlayhead) !== JSON.stringify(newPlayhead);
  }

  private getPlayheadDiff(oldPlayhead: any, newPlayhead: any): any {
    return this.getObjectDiff(oldPlayhead, newPlayhead);
  }

  private hasSelectionChanged(oldSelection: any, newSelection: any): boolean {
    return JSON.stringify(oldSelection) !== JSON.stringify(newSelection);
  }

  private getSelectionDiff(oldSelection: any, newSelection: any): any {
    return this.getObjectDiff(oldSelection, newSelection);
  }

  private getCollaboratorsDiff(oldCollaborators: any[], newCollaborators: any[]): any {
    const oldCollaboratorsMap = new Map(oldCollaborators.map(collab => [collab.id, collab]));
    const newCollaboratorsMap = new Map(newCollaborators.map(collab => [collab.id, collab]));

    const added = newCollaborators.filter(collab => !oldCollaboratorsMap.has(collab.id));
    const removed = oldCollaborators.filter(collab => !newCollaboratorsMap.has(collab.id)).map(collab => collab.id);
    const updated: any[] = [];

    newCollaborators.forEach(newCollab => {
      const oldCollab = oldCollaboratorsMap.get(newCollab.id);
      if (oldCollab && JSON.stringify(oldCollab) !== JSON.stringify(newCollab)) {
        updated.push({
          id: newCollab.id,
          changes: this.getObjectDiff(oldCollab, newCollab)
        });
      }
    });

    return { added, removed, updated };
  }

  private getObjectDiff(oldObj: any, newObj: any): any {
    const diff: any = {};
    
    Object.keys(newObj).forEach(key => {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        diff[key] = newObj[key];
      }
    });
    
    return diff;
  }
} 