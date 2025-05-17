export class ListTracksQuery {
  constructor(
    public readonly filter?: {
      type?: 'audio' | 'instrument' | 'bus';
      muted?: boolean;
      solo?: boolean;
    }
  ) {}
} 
