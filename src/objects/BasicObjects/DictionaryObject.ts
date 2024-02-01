import { ObjectType } from 'enums';
import { IDictionaryObject } from 'interfaces';
import { BaseObject, NameObject, NullObject, ArrayObject, BooleanObject, NumericObject, StringObject, StreamObject } from 'objects';

export class DictionaryObject extends BaseObject implements IDictionaryObject {
  private _value: Map<
    NameObject,
    NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject
  >;

  constructor(
    value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    super(type, id, generation);
    this._value = value;
  }

  outputObject(): string {
    let value = '<< ';
    this.value.forEach((val, key) => {
      value += `${key.isIndirect() ? key.getReference() : key.outputObject()} ${val.isIndirect() ? val.getReference() : val.outputObject()} `;
    });
    value += '>>';
    return super.outputObject(value);
  }

  getDictionaryValue(
    key: NameObject | string,
  ): NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject | undefined {
    return this._value.get(key instanceof NameObject ? key : new NameObject(key));
  }

  setDictionaryValue(
    key: NameObject | string,
    value: NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject,
  ): void {
    this._value.set(key instanceof NameObject ? key : new NameObject(key), value);
  }

  get value(): Map<
    NameObject,
    NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject
  > {
    return this._value;
  }

  set value(
    value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>,
  ) {
    this._value = value;
  }
}

export default DictionaryObject;
