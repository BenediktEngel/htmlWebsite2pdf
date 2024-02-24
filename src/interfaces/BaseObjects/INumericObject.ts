import type { IBaseObject } from './IBaseObject';

export interface INumericObject extends IBaseObject {
  value: number;

  toBuffer(): Buffer;
}
