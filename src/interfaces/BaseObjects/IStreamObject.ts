import { IBaseObject } from 'interfaces';
import { DictionaryObject } from 'objects';

export interface IStreamObject extends IBaseObject {
  value: string;
  streamDictionary: DictionaryObject;

  outputObject(): string;
}
