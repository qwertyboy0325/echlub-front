import { IValueObject } from './IValueObject';

export interface IPluginReference extends IValueObject {
  getId(): string;
  equals(other: IPluginReference): boolean;
  toString(): string;
} 