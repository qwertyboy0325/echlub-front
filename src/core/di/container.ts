import { Container } from 'inversify';
import { TYPES } from './types';

// Event System
import { EventBus } from '../events/EventBus';
import { EventQueue } from '../events/EventQueue';
import { EventStateSync } from '../events/EventStateSync';
import { EventStateOptimizer } from '../events/EventStateOptimizer';
import { EventStateErrorHandler } from '../events/EventStateErrorHandler';
import { IEventBus } from '../events/interfaces/IEventBus';

// State Management
import { StateManager } from '../state/StateManager';
import { StateStore } from '../state/StateStore';
import { StorageService } from '../state/persist/StorageService';
import { IStateManager } from '../state/interfaces/IStateManager';

// Infrastructure
import { Logger } from '../logger/Logger';
import { ConfigService } from '../config/ConfigService';
import { ApiClient } from '../../infrastructure/api/ApiClient';

// Features
import { TrackService } from '../../features/TrackEditor/services/TrackService';
import { ClipService } from '../../features/TrackEditor/services/ClipService';
import { ProjectService } from '../../features/ProjectLoader/services/ProjectService';
import { TransportService } from '../../features/TransportBar/services/TransportService';

// Repositories
import { ProjectRepository } from '../../infrastructure/repositories/ProjectRepository';
import { TrackRepository } from '../../infrastructure/repositories/TrackRepository';
import { ClipRepository } from '../../infrastructure/repositories/ClipRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';

// Create and configure container
const container = new Container();

// Bind Event System
container.bind<IEventBus>(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind(TYPES.EventQueue).to(EventQueue).inSingletonScope();
container.bind(TYPES.EventStateSync).to(EventStateSync).inSingletonScope();
container.bind(TYPES.EventStateOptimizer).to(EventStateOptimizer).inSingletonScope();
container.bind(TYPES.EventStateErrorHandler).to(EventStateErrorHandler).inSingletonScope();

// Bind State Management
container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
container.bind(TYPES.StateStore).to(StateStore).inSingletonScope();
container.bind(TYPES.StorageService).to(StorageService).inSingletonScope();

// Bind Infrastructure
container.bind(TYPES.Logger).to(Logger).inSingletonScope();
container.bind(TYPES.ConfigService).to(ConfigService).inSingletonScope();
container.bind(TYPES.ApiClient).to(ApiClient).inSingletonScope();

// Bind Features
container.bind(TYPES.TrackService).to(TrackService).inSingletonScope();
container.bind(TYPES.ClipService).to(ClipService).inSingletonScope();
container.bind(TYPES.ProjectService).to(ProjectService).inSingletonScope();
container.bind(TYPES.TransportService).to(TransportService).inSingletonScope();

// Bind Repositories
container.bind(TYPES.ProjectRepository).to(ProjectRepository).inSingletonScope();
container.bind(TYPES.TrackRepository).to(TrackRepository).inSingletonScope();
container.bind(TYPES.ClipRepository).to(ClipRepository).inSingletonScope();
container.bind(TYPES.UserRepository).to(UserRepository).inSingletonScope();

export { container }; 