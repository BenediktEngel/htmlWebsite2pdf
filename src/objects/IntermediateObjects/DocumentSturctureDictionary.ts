import { ObjectType } from 'enums';
import { IDocumentStructureDictionary } from 'interfaces';
import { ArrayObject, BooleanObject, DictionaryObject, NameObject, NullObject, NumericObject, StreamObject, StringObject } from 'objects';
import { TOptionalValues, TRequiredValues } from 'types';

export abstract class DocumentStructureDictionary extends DictionaryObject implements IDocumentStructureDictionary {
  readonly requieredValues: Array<TRequiredValues> = [];

  readonly optionalValues: Array<TOptionalValues> = [];

  readonly fixedValues:
    | Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>
    | undefined;

  constructor(
    value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    super(value, type, id, generation);
    // Set fixed Values
    if (this.fixedValues)
      this.fixedValues.forEach((val, key) => {
        this.value.set(key, val);
      });
  }

  get requieredValuesSet(): boolean {
    return !this.requieredValues.some((value) => !this.value.has(new NameObject(value.name))); // TODO Maybe check hier for empty value
  }

  getValue(
    key: NameObject | string,
  ): NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject | undefined {
    return super.getValue(key);
  }

  setValue(
    key: NameObject | string,
    value: NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject,
  ): void {
    if (this.fixedValues && this.fixedValues.has(key instanceof NameObject ? key : new NameObject(key))) {
      throw new Error('Trying to set a fixed value');
    } else if (
      !this.requieredValues.some((requiredValue) => requiredValue.name === (key instanceof NameObject ? key.value : key)) &&
      !this.optionalValues.some((optionalValue) => optionalValue.name === (key instanceof NameObject ? key.value : key))
    ) {
      throw new Error('Trying to set a value that is not allowed');
    }
    super.setValue(key instanceof NameObject ? key : new NameObject(key), value);
  }
}

export default DocumentStructureDictionary;
