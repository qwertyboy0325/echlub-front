import { SessionStatus } from '../../domain/aggregates/Session';

export interface RoleDto {
  id: string;
  name: string;
  color: string;
}

export interface PlayerDto {
  peerId: string;
  role: RoleDto | null;
  isReady: boolean;
  joinedAt: string;
}

export interface RoundDto {
  roundNumber: number;
  startedAt: string;
  durationSeconds: number;
  endedAt: string | null;
  isActive: boolean;
}

export interface SessionDto {
  id: string;
  roomId: string;
  status: SessionStatus;
  currentRoundNumber: number;
  players: PlayerDto[];
  rounds: RoundDto[];
} 