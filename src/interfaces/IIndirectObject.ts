import type { IBaseObject } from './BaseObjects/IBaseObject';

export interface IIndirectObject {
  obj: IBaseObject;
  generation: number;
  byteOffset?: number;
}
