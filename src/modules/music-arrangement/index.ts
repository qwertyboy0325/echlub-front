/**
 * ✅ Music Arrangement Bounded Context - Clean Architecture Exports
 * 
 * This module follows Clean Architecture principles by ONLY exposing:
 * 1. Application Service (the single entry point)
 * 2. DTOs for data transfer
 * 3. Container for dependency injection
 * 
 * ❌ Domain Layer types are NOT exported (Track, TrackId, etc.)
 * ❌ Infrastructure Layer types are NOT exported (EventStore, etc.)
 * ❌ Command/Query objects are NOT exported (handled internally)
 */

// ✅ Application Service - The ONLY entry point for users
export { MusicArrangementService } from './application/services/MusicArrangementService';
export { SimpleMusicArrangementService } from './application/services/SimpleMusicArrangementService';

// ✅ DTOs for Clean Architecture compliance
export type {
  TrackInfoDTO,
  ClipInfoDTO,
  TimeRangeDTO,
  InstrumentDTO,
  SystemStatsDTO,
  TrackStatusDTO,
  DebugInfoDTO,
  ValidationResultDTO
} from './application/services/MusicArrangementService';

// ✅ Dependency Injection Container
export { MusicArrangementContainer } from './di/MusicArrangementContainer';
export { MusicArrangementTypes } from './di/MusicArrangementTypes';

/**
 * ✅ Usage Example:
 * 
 * ```typescript
 * import { 
 *   MusicArrangementService,
 *   MusicArrangementContainer,
 *   type TrackInfoDTO 
 * } from '@/modules/music-arrangement';
 * 
 * const container = new MusicArrangementContainer();
 * await container.initialize();
 * 
 * const service = container.get<MusicArrangementService>('MusicArrangementService');
 * 
 * // Create track with simple data types
 * const trackId = await service.createTrack('user123', 'instrument', 'Lead Synth');
 * 
 * // Get track info as DTO
 * const trackInfo: TrackInfoDTO = await service.getTrackInfo(trackId);
 * ```
 */ 