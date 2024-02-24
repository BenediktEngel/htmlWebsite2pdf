import type { IBaseObject } from './IBaseObject';

export interface INameObject extends IBaseObject {
  value: string;

  toBuffer(): Buffer;
}
