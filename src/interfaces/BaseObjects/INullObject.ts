import type { IBaseObject } from './IBaseObject';

export interface INullObject extends IBaseObject {
  value: null;
  toString(): string;
}
