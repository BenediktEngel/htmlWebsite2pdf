import { IBaseObject } from 'index';

export interface INumericObject extends IBaseObject {
  value: number;

  toString(): string;
}
