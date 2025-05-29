import { InMemoryEventStore } from '../EventStore';
import { DomainEvent } from '../../../../../core/events/DomainEvent';
import { TrackId } from '../../../domain/value-objects/TrackId';

// Mock events for testing
class TestEvent extends DomainEvent {
  public version: number;
  
  constructor(
    public readonly data: string,
    aggregateId: string,
    version: number = 1
  ) {
    super('TestEvent', aggregateId);
    this.version = version;
  }
}

class AnotherTestEvent extends DomainEvent {
  public version: number;
  
  constructor(
    public readonly value: number,
    aggregateId: string,
    version: number = 1
  ) {
    super('AnotherTestEvent', aggregateId);
    this.version = version;
  }
}

describe('InMemoryEventStore', () => {
  let eventStore: InMemoryEventStore;
  let trackId: TrackId;

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
    trackId = TrackId.create();
  });

  describe('saveEvents', () => {
    it('應該能保存單個事件', async () => {
      const event = new TestEvent('test data', trackId.toString(), 1);
      
      await eventStore.saveEvents(trackId.toString(), [event], 0);
      
      const savedEvents = await eventStore.getEventsForAggregate(trackId.toString());
      expect(savedEvents).toHaveLength(1);
      expect(savedEvents[0].eventName).toBe('TestEvent');
      expect((savedEvents[0] as TestEvent).data).toBe('test data');
    });

    it('應該能保存多個事件', async () => {
      const events = [
        new TestEvent('event 1', trackId.toString(), 1),
        new AnotherTestEvent(42, trackId.toString(), 2),
        new TestEvent('event 3', trackId.toString(), 3)
      ];
      
      await eventStore.saveEvents(trackId.toString(), events, 0);
      
      const savedEvents = await eventStore.getEventsForAggregate(trackId.toString());
      expect(savedEvents).toHaveLength(3);
      expect(savedEvents[0].eventName).toBe('TestEvent');
      expect(savedEvents[1].eventName).toBe('AnotherTestEvent');
      expect(savedEvents[2].eventName).toBe('TestEvent');
    });

    it('應該正確設置事件版本號', async () => {
      const events = [
        new TestEvent('event 1', trackId.toString()),
        new TestEvent('event 2', trackId.toString())
      ];
      
      // 分別保存事件，讓 EventStore 自動設置版本號
      await eventStore.saveEvents(trackId.toString(), [events[0]], 0);
      await eventStore.saveEvents(trackId.toString(), [events[1]], 1);
      
      // 檢查內部存儲的事件版本號
      const allStoredEvents = eventStore.getAllEvents();
      const trackEvents = allStoredEvents.filter(e => e.aggregateId === trackId.toString());
      
      expect(trackEvents).toHaveLength(2);
      expect(trackEvents[0].version).toBe(1);
      expect(trackEvents[1].version).toBe(2);
    });

    it('應該支援樂觀並發控制', async () => {
      const event1 = new TestEvent('first', trackId.toString(), 1);
      await eventStore.saveEvents(trackId.toString(), [event1], 0);

      // 嘗試用錯誤的期望版本保存
      const event2 = new TestEvent('second', trackId.toString(), 2);
      
      await expect(
        eventStore.saveEvents(trackId.toString(), [event2], 0)
      ).rejects.toThrow('Concurrency conflict');
    });

    it('應該正確處理並發衝突', async () => {
      const event1 = new TestEvent('first', trackId.toString(), 1);
      await eventStore.saveEvents(trackId.toString(), [event1], 0);

      const event2 = new TestEvent('second', trackId.toString(), 2);
      await eventStore.saveEvents(trackId.toString(), [event2], 1);

      const savedEvents = await eventStore.getEventsForAggregate(trackId.toString());
      expect(savedEvents).toHaveLength(2);
      expect((savedEvents[1] as TestEvent).version).toBe(2);
    });
  });

  describe('getEventsForAggregate', () => {
    it('應該返回空陣列當沒有事件時', async () => {
      const events = await eventStore.getEventsForAggregate(trackId.toString());
      expect(events).toEqual([]);
    });

    it('應該按版本順序返回事件', async () => {
      // 按順序保存事件
      const event1 = new TestEvent('first', trackId.toString(), 1);
      const event2 = new TestEvent('second', trackId.toString(), 2);
      const event3 = new TestEvent('third', trackId.toString(), 3);
      
      await eventStore.saveEvents(trackId.toString(), [event1], 0);
      await eventStore.saveEvents(trackId.toString(), [event2], 1);
      await eventStore.saveEvents(trackId.toString(), [event3], 2);
      
      const savedEvents = await eventStore.getEventsForAggregate(trackId.toString());
      expect(savedEvents).toHaveLength(3);
      expect((savedEvents[0] as TestEvent).version).toBe(1);
      expect((savedEvents[1] as TestEvent).version).toBe(2);
      expect((savedEvents[2] as TestEvent).version).toBe(3);
    });

    it('應該支援從特定版本開始獲取事件', async () => {
      // 按順序保存4個事件
      const events = [
        new TestEvent('v1', trackId.toString(), 1),
        new TestEvent('v2', trackId.toString(), 2),
        new TestEvent('v3', trackId.toString(), 3),
        new TestEvent('v4', trackId.toString(), 4)
      ];
      
      for (let i = 0; i < events.length; i++) {
        await eventStore.saveEvents(trackId.toString(), [events[i]], i);
      }
      
      const eventsFromV2 = await eventStore.getEventsForAggregate(trackId.toString(), 2);
      expect(eventsFromV2).toHaveLength(2); // v3 和 v4
      expect((eventsFromV2[0] as TestEvent).version).toBe(3);
      expect((eventsFromV2[1] as TestEvent).version).toBe(4);
    });
  });

  describe('getLatestVersion', () => {
    it('應該返回0當沒有事件時', async () => {
      const events = await eventStore.getEventsForAggregate(trackId.toString());
      expect(events.length).toBe(0);
    });

    it('應該返回最新版本號', async () => {
      const events = [
        new TestEvent('v1', trackId.toString(), 1),
        new TestEvent('v2', trackId.toString(), 2),
        new TestEvent('v3', trackId.toString(), 3)
      ];
      
      for (let i = 0; i < events.length; i++) {
        await eventStore.saveEvents(trackId.toString(), [events[i]], i);
      }
      
      const allEvents = await eventStore.getEventsForAggregate(trackId.toString());
      expect(allEvents.length).toBe(3);
    });
  });

  describe('saveSnapshot', () => {
    it('應該能保存快照', async () => {
      const snapshotData = {
        aggregateId: trackId.toString(),
        aggregateType: 'Track',
        version: 5,
        data: { name: 'Test Track', clips: [] },
        timestamp: new Date()
      };
      
      await eventStore.saveSnapshot(trackId.toString(), snapshotData, 5);
      
      const snapshot = await eventStore.getSnapshot(trackId.toString());
      expect(snapshot).toBeDefined();
      expect(snapshot!.version).toBe(5);
      expect(snapshot!.data).toEqual({ name: 'Test Track', clips: [] });
    });

    it('應該覆蓋舊快照', async () => {
      const oldSnapshot = {
        aggregateId: trackId.toString(),
        aggregateType: 'Track',
        version: 3,
        data: { name: 'Old Track' },
        timestamp: new Date()
      };
      const newSnapshot = {
        aggregateId: trackId.toString(),
        aggregateType: 'Track',
        version: 7,
        data: { name: 'New Track' },
        timestamp: new Date()
      };
      
      await eventStore.saveSnapshot(trackId.toString(), oldSnapshot, 3);
      await eventStore.saveSnapshot(trackId.toString(), newSnapshot, 7);
      
      const snapshot = await eventStore.getSnapshot(trackId.toString());
      expect(snapshot!.version).toBe(7);
      expect(snapshot!.data).toEqual({ name: 'New Track' });
    });
  });

  describe('getSnapshot', () => {
    it('應該返回null當沒有快照時', async () => {
      const snapshot = await eventStore.getSnapshot(trackId.toString());
      expect(snapshot).toBeNull();
    });

    it('應該返回最新快照', async () => {
      const snapshotData = {
        aggregateId: trackId.toString(),
        aggregateType: 'Track',
        version: 10,
        data: { name: 'Test Track', version: 10 },
        timestamp: new Date()
      };
      await eventStore.saveSnapshot(trackId.toString(), snapshotData, 10);
      
      const snapshot = await eventStore.getSnapshot(trackId.toString());
      expect(snapshot).toBeDefined();
      expect(snapshot!.version).toBe(10);
      expect(snapshot!.data).toEqual({ name: 'Test Track', version: 10 });
    });
  });

  describe('多個 Aggregate 隔離', () => {
    it('應該正確隔離不同 aggregate 的事件', async () => {
      const trackId1 = TrackId.create();
      const trackId2 = TrackId.create();
      
      const event1 = new TestEvent('track1 event', trackId1.toString(), 1);
      const event2 = new TestEvent('track2 event', trackId2.toString(), 1);
      
      await eventStore.saveEvents(trackId1.toString(), [event1], 0);
      await eventStore.saveEvents(trackId2.toString(), [event2], 0);
      
      const track1Events = await eventStore.getEventsForAggregate(trackId1.toString());
      const track2Events = await eventStore.getEventsForAggregate(trackId2.toString());
      
      expect(track1Events).toHaveLength(1);
      expect(track2Events).toHaveLength(1);
      expect((track1Events[0] as TestEvent).data).toBe('track1 event');
      expect((track2Events[0] as TestEvent).data).toBe('track2 event');
    });
  });

  describe('性能測試', () => {
    it('應該能處理大量事件', async () => {
      const eventCount = 1000;
      const events: TestEvent[] = [];
      
      for (let i = 1; i <= eventCount; i++) {
        events.push(new TestEvent(`event ${i}`, trackId.toString(), i));
      }
      
      const startTime = Date.now();
      
      // 批量保存
      for (let i = 0; i < events.length; i += 100) {
        const batch = events.slice(i, i + 100);
        await eventStore.saveEvents(trackId.toString(), batch, i);
      }
      
      const saveTime = Date.now() - startTime;
      
      const retrieveStartTime = Date.now();
      const savedEvents = await eventStore.getEventsForAggregate(trackId.toString());
      const retrieveTime = Date.now() - retrieveStartTime;
      
      expect(savedEvents).toHaveLength(eventCount);
      expect(saveTime).toBeLessThan(1000); // 應該在1秒內完成
      expect(retrieveTime).toBeLessThan(100); // 檢索應該很快
    });
  });
}); 