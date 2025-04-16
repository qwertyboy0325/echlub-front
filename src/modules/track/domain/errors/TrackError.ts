export class TrackError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TrackError';
  }
}

export class TrackValidationError extends TrackError {
  constructor(errors: any[]) {
    super(
      'Track validation failed',
      'TRACK_VALIDATION_ERROR',
      { errors }
    );
  }
}

export class TrackNotFoundError extends TrackError {
  constructor(trackId: string) {
    super(
      `Track with id ${trackId} not found`,
      'TRACK_NOT_FOUND',
      { trackId }
    );
  }
}

export class TrackOperationError extends TrackError {
  constructor(message: string, cause?: Error) {
    super(
      message,
      'TRACK_OPERATION_ERROR',
      { cause }
    );
  }
}

export class TrackAlreadyExistsError extends TrackError {
  constructor(trackId: string) {
    super(
      `Track with id ${trackId} already exists`,
      'TRACK_ALREADY_EXISTS',
      { trackId }
    );
  }
}

export class TrackInvalidStateError extends TrackError {
  constructor(message: string, details?: any) {
    super(
      message,
      'TRACK_INVALID_STATE',
      details
    );
  }
} 