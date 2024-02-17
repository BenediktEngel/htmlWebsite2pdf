import { IBaseObject } from './IBaseObject';
import {
  NameObject,
  BaseObject,
  ArrayObject,
  BooleanObject,
  DictionaryObject,
  IntegerObject,
  NullObject,
  NumericObject,
  StreamObject,
  StringObject,
} from '../../objects/BasicObjects';

export interface IDictionaryObject extends IBaseObject {
  value: Map<
    NameObject,
    ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
  >;

  toString(): string;
  getValueByKey(key: NameObject | string): BaseObject | undefined;
  setValueByKey(key: NameObject | string, value: BaseObject): void;
}
