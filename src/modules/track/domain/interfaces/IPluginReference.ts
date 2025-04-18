export interface IPluginReference {
  id: string;
  equals(other: IPluginReference): boolean;
  toString(): string;
} 