export const EventPriority = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2
} as const;

export type EventPriorityType = typeof EventPriority[keyof typeof EventPriority]; 