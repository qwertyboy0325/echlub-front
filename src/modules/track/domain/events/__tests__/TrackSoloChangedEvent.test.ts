import { TrackId } from '../../value-objects/track/TrackId';
import { TrackSoloChangedEvent } from '../TrackSoloChangedEvent';

describe('TrackSoloChangedEvent', () => {
  let trackId: TrackId;

  beforeEach(() => {
    trackId = TrackId.create();
  });

  it('應該正確初始化事件屬性', () => {
    const oldSolo = false;
    const newSolo = true;
    const event = new TrackSoloChangedEvent(trackId, oldSolo, newSolo);

    expect(event.eventType).toBe('track:solo:changed');
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.aggregateId).toBe(trackId.toString());
    expect(event.oldSolo).toBe(oldSolo);
    expect(event.newSolo).toBe(newSolo);
    expect(event.getEventName()).toBe('track:solo:changed');
  });

  it('應該有一個空的 payload', () => {
    const event = new TrackSoloChangedEvent(trackId, false, true);
    expect(event.payload).toEqual({});
  });

  it('應該設置正確的時間戳', () => {
    const before = Date.now();
    const event = new TrackSoloChangedEvent(trackId, false, true);
    const after = Date.now();

    const timestamp = event.timestamp.getTime();
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
}); 