import { StringType } from 'enums';
import { IBaseObject } from 'interfaces';

export interface IStringObject extends IBaseObject {
  value: string;
  stringType: StringType;
}
