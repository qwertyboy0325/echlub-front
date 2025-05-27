import { injectable } from 'inversify';
import { MusicClipOperationEvent, ClipOperation } from '../../domain/events/integration/MusicClipOperationEvent';
import { TrackId } from '../../domain/value-objects/TrackId';
import { PeerId } from '../../domain/aggregates/Track';

// Placeholder for event bus - should be imported from core
interface IEventBus {
  publish(event: any): void;
  subscribe(eventName: string, handler: (event: any) => void): void;
}

// Placeholder for WebRTC connection - should be imported from collaboration infrastructure
interface WebRTCConnection {
  send(data: any): void;
  onMessage(callback: (data: any) => void): void;
  isConnected(): boolean;
}

/**
 * Collaboration Adapter
 * Handles cross-BC communication for real-time collaboration
 */
@injectable()
export class CollaborationAdapter {
  private connections: Map<string, WebRTCConnection> = new Map();

  constructor(
    private eventBus: IEventBus
  ) {
    this.setupEventSubscriptions();
  }

  private setupEventSubscriptions(): void {
    // Subscribe to local clip operations to broadcast to other peers
    this.eventBus.subscribe('music.clip-operation', (event: MusicClipOperationEvent) => {
      this.broadcastOperation(event);
    });
  }

  /**
   * Broadcast clip operation to all connected peers
   */
  private broadcastOperation(event: MusicClipOperationEvent): void {
    const message = {
      type: 'clip-operation',
      data: event.eventData,
      timestamp: new Date().toISOString()
    };

    for (const [peerId, connection] of this.connections) {
      if (connection.isConnected()) {
        try {
          connection.send(message);
        } catch (error) {
          console.error(`Failed to send operation to peer ${peerId}:`, error);
        }
      }
    }
  }

  /**
   * Handle incoming clip operation from remote peer
   */
  public handleRemoteOperation(
    operation: ClipOperation,
    trackId: TrackId,
    fromPeerId: PeerId
  ): void {
    // Create integration event for local processing
    const event = new MusicClipOperationEvent(operation, trackId, fromPeerId);
    
    // Publish to local event bus for processing by MusicArrangementService
    this.eventBus.publish(event);
  }

  /**
   * Add peer connection for collaboration
   */
  public addPeerConnection(peerId: string, connection: WebRTCConnection): void {
    this.connections.set(peerId, connection);
    
    // Setup message handler for this connection
    connection.onMessage((data: any) => {
      this.handleIncomingMessage(peerId, data);
    });
  }

  /**
   * Remove peer connection
   */
  public removePeerConnection(peerId: string): void {
    this.connections.delete(peerId);
  }

  /**
   * Handle incoming message from peer
   */
  private handleIncomingMessage(fromPeerId: string, data: any): void {
    try {
      if (data.type === 'clip-operation') {
        const operationData = data.data;
        
        // Reconstruct operation and IDs
        const operation: ClipOperation = {
          type: operationData.operation.type,
          clipId: { toString: () => operationData.operation.clipId } as any, // Simplified for now
          data: operationData.operation.data,
          timestamp: new Date(operationData.operation.timestamp)
        };
        
        const trackId = { toString: () => operationData.trackId } as TrackId;
        const peerId = { toString: () => fromPeerId } as PeerId;
        
        this.handleRemoteOperation(operation, trackId, peerId);
      }
    } catch (error) {
      console.error(`Error handling message from peer ${fromPeerId}:`, error);
    }
  }

  /**
   * Get connected peer count
   */
  public getConnectedPeerCount(): number {
    return Array.from(this.connections.values())
      .filter(conn => conn.isConnected()).length;
  }

  /**
   * Get list of connected peer IDs
   */
  public getConnectedPeerIds(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, conn]) => conn.isConnected())
      .map(([peerId, _]) => peerId);
  }
} 