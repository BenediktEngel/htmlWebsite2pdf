import { IBaseObject } from 'interfaces';
import { NullObject, StringObject, BooleanObject, DictionaryObject, NameObject, NumericObject } from 'objects';

export interface IArrayObject extends IBaseObject {
  value: Array<NullObject | StringObject | BooleanObject | DictionaryObject | NameObject | NumericObject>;

  outputObject(): string;
}
