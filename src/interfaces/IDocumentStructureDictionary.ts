import { IDictionaryObject } from 'interfaces';
import { DictionaryObject, NameObject, ArrayObject, BooleanObject, NullObject, NumericObject, StreamObject, StringObject } from 'objects';
import { TRequiredValues, TOptionalValues } from 'types';

export interface IDocumentStructureDictionary extends IDictionaryObject {
  requieredValues: Array<TRequiredValues>;
  optionalValues: Array<TOptionalValues>;
  fixedValues:
    | Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>
    | undefined;
  requieredValuesSet: boolean;
}
