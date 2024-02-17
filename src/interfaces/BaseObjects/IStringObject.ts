import { StringType } from '../../enums';
import { IBaseObject } from './IBaseObject';

export interface IStringObject extends IBaseObject {
  value: string;
  stringType: StringType;

  toString(): string;
}
