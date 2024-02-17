import type { IBaseObject } from './IBaseObject';

export interface IBooleanObject extends IBaseObject {
  value: boolean;

  toString(): string;
}
