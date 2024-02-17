import type { IBaseObject } from './IBaseObject';

export interface INumericObject extends IBaseObject {
  value: number;

  toString(): string;
}
