// import { IBaseObject } from './IBaseObject';
import { IBaseObject } from 'index';
import { DictionaryObject } from '../../objects/BasicObjects';

export interface IStreamObject extends IBaseObject {
  value: string;
  streamDictionary: DictionaryObject;

  toString(): string;
}
