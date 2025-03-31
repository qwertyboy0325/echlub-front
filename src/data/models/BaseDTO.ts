export interface BaseDTO {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
} 