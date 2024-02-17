import { IBaseObject } from 'index';

export interface INullObject extends IBaseObject {
  value: null;
  toString(): string;
}
