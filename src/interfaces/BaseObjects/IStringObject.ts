import { StringType } from '../../enums/StringType';
import type { IBaseObject } from './IBaseObject';

export interface IStringObject extends IBaseObject {
  value: string;
  stringType: StringType;

  toString(): string;
}
