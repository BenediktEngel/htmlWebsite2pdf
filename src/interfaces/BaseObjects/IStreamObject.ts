import type { IBaseObject } from './IBaseObject';
import type { IDictionaryObject } from './IDictionaryObject';

export interface IStreamObject extends IBaseObject {
  value: string;
  streamDictionary: IDictionaryObject;

  toBuffer(): Buffer;
}
