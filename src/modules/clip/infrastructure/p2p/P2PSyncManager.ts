import { injectable } from 'inversify';

export type MessageHandler = (data: any) => Promise<void>;

@injectable()
export class P2PSyncManager {
  private peers: Map<string, RTCDataChannel>;
  private messageHandlers: Map<string, MessageHandler[]>;
  private messageQueue: any[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    this.peers = new Map();
    this.messageHandlers = new Map();
  }

  onMessage(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  broadcast(message: any): void {
    this.messageQueue.push(message);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) return;

    this.isProcessingQueue = true;
    const batchMessages = this.messageQueue.splice(0, 10); // 每次處理10條消息

    try {
      const messageString = JSON.stringify(batchMessages);
      this.peers.forEach(channel => {
        if (channel.readyState === 'open') {
          channel.send(messageString);
        }
      });
    } catch (error) {
      console.error('Error broadcasting messages:', error);
      // 失敗的消息放回隊列
      this.messageQueue.unshift(...batchMessages);
    }

    this.isProcessingQueue = false;
    
    // 如果還有消息，繼續處理
    if (this.messageQueue.length > 0) {
      setTimeout(() => this.processQueue(), 50); // 50ms後處理下一批
    }
  }

  addPeer(peerId: string, channel: RTCDataChannel): void {
    this.peers.set(peerId, channel);
    
    channel.onmessage = async (event) => {
      try {
        const messages = JSON.parse(event.data);
        for (const message of messages) {
          const handlers = this.messageHandlers.get(message.type) || [];
          await Promise.all(handlers.map(handler => handler(message)));
        }
      } catch (error) {
        console.error('Error handling peer message:', error);
      }
    };
  }

  removePeer(peerId: string): void {
    const channel = this.peers.get(peerId);
    if (channel) {
      channel.close();
      this.peers.delete(peerId);
    }
  }
} 