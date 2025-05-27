import { injectable, inject } from 'inversify';
import type { IntegrationEventBus } from '../../../../core/events/IntegrationEventBus';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

/**
 * Collaboration Adapter
 * Handles integration with Collaboration BC for real-time collaboration
 */
@injectable()
export class CollaborationAdapter {
  private connectedPeers: Set<string> = new Set();

  constructor(
    @inject('IntegrationEventBus')
    private readonly integrationEventBus: IntegrationEventBus,
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {
    this.setupEventSubscriptions();
  }

  /**
   * Setup event subscriptions for collaboration events
   */
  private setupEventSubscriptions(): void {
    this.integrationEventBus.subscribe(
      'collaboration.peer-joined',
      this.handlePeerJoined.bind(this)
    );

    this.integrationEventBus.subscribe(
      'collaboration.peer-left',
      this.handlePeerLeft.bind(this)
    );

    this.integrationEventBus.subscribe(
      'collaboration.operation-received',
      this.handleOperationReceived.bind(this)
    );
  }

  /**
   * Handle peer joined event
   */
  private async handlePeerJoined(event: any): Promise<void> {
    try {
      const peerId = event.peerId;
      this.connectedPeers.add(peerId);
      
      console.log(`Peer joined music arrangement session: ${peerId}`);
      
      // Optionally sync current state with new peer
      await this.syncStateWithPeer(peerId);
    } catch (error) {
      console.error('Error handling peer joined:', error);
    }
  }

  /**
   * Handle peer left event
   */
  private async handlePeerLeft(event: any): Promise<void> {
    try {
      const peerId = event.peerId;
      this.connectedPeers.delete(peerId);
      
      console.log(`Peer left music arrangement session: ${peerId}`);
    } catch (error) {
      console.error('Error handling peer left:', error);
    }
  }

  /**
   * Handle operation received from remote peer
   */
  private async handleOperationReceived(event: any): Promise<void> {
    try {
      const { operation, peerId } = event;
      
      console.log(`Received operation from peer ${peerId}:`, operation);
      
      // Apply the operation to the appropriate track
      if (operation.trackId) {
        const track = await this.trackRepository.loadWithClips(operation.trackId);
        if (track) {
          track.applyRemoteOperation(operation, peerId);
          await this.trackRepository.saveWithClips(track);
        }
      }
    } catch (error) {
      console.error('Error handling operation received:', error);
    }
  }

  /**
   * Sync current state with a specific peer
   */
  private async syncStateWithPeer(peerId: string): Promise<void> {
    try {
      // Get all tracks for the current session
      // This would need to be implemented based on your session management
      console.log(`Syncing state with peer: ${peerId}`);
      
      // TODO: Implement state synchronization
      // This would involve sending current track states to the new peer
    } catch (error) {
      console.error(`Error syncing state with peer ${peerId}:`, error);
    }
  }

  /**
   * Broadcast operation to all connected peers
   */
  public async broadcastOperation(operation: any, excludePeerId?: string): Promise<void> {
    try {
      const event = {
        eventType: 'music-arrangement.operation-broadcast',
        operation,
        excludePeerId,
        timestamp: new Date().toISOString()
      };

      await this.integrationEventBus.publish(event as any);
    } catch (error) {
      console.error('Error broadcasting operation:', error);
    }
  }

  /**
   * Get connected peer count
   */
  public getConnectedPeerCount(): number {
    return this.connectedPeers.size;
  }

  /**
   * Get connected peers
   */
  public getConnectedPeers(): string[] {
    return Array.from(this.connectedPeers);
  }

  /**
   * Remove peer connection
   */
  public removePeerConnection(peerId: string): void {
    this.connectedPeers.delete(peerId);
  }

  /**
   * Cleanup adapter
   */
  public dispose(): void {
    this.connectedPeers.clear();
  }
} 