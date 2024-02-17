import { IBaseObject } from './IBaseObject';

export interface INameObject extends IBaseObject {
  value: string;

  toString(): string;
}
