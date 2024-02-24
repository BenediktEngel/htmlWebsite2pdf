import type { IBaseObject } from './IBaseObject';
import type { IDictionaryObject } from './IDictionaryObject';

export interface IStreamObject extends IBaseObject {
  value: string | Buffer;
  streamDictionary: IDictionaryObject;

  toBuffer(): Buffer;
}
