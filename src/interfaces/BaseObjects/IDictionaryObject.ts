import { IBaseObject } from 'interfaces';
import { NameObject, NullObject, ArrayObject, BooleanObject, NumericObject, StringObject, StreamObject, DictionaryObject } from 'objects';

export interface IDictionaryObject extends IBaseObject {
  value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>;

  outputObject(): string;
}
