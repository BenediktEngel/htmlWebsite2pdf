import type { IDictionaryObject } from './BaseObjects/IDictionaryObject';
import type { INameObject } from './BaseObjects/INameObject';
import type { TRequiredValue, TOptionalValue } from '../types';

export interface IDocumentStructureDictionary extends IDictionaryObject {
  requieredValues: Array<TRequiredValue>;
  optionalValues: Array<TOptionalValue>;

  requieredValuesSet(): boolean;
  getRequiredValuesByVersion(): Array<TRequiredValue>;
  getOptionalValuesByVersion(): Array<TOptionalValue>;
  isValueApplicableByVersion(value: TRequiredValue | TOptionalValue): boolean;
  isValueApplicable(key: string | INameObject): boolean;
}
