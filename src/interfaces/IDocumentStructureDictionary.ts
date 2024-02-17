import { IDictionaryObject } from './BaseObjects';
import { NameObject } from '../objects/BasicObjects';
import { TRequiredValue, TOptionalValue } from '../types';

export interface IDocumentStructureDictionary extends IDictionaryObject {
  requieredValues: Array<TRequiredValue>;
  optionalValues: Array<TOptionalValue>;

  requieredValuesSet(): boolean;
  getRequiredValuesByVersion(): Array<TRequiredValue>;
  getOptionalValuesByVersion(): Array<TOptionalValue>;
  isValueApplicableByVersion(value: TRequiredValue | TOptionalValue): boolean;
  isValueApplicable(key: string | NameObject): boolean;
}
