import { ObjectType } from 'enums';
import { IArrayObject } from 'interfaces';
import { BaseObject, NullObject, StringObject, BooleanObject, DictionaryObject, NameObject, NumericObject, IntegerObject } from 'objects';

export class ArrayObject extends BaseObject implements IArrayObject {
  protected _value: Array<NullObject | StringObject | BooleanObject | DictionaryObject | NameObject | NumericObject | IntegerObject>;

  constructor(
    value: Array<NullObject | StringObject | BooleanObject | DictionaryObject | NameObject | NumericObject | IntegerObject>,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    super(type, id, generation);
    this._value = value;
  }

  outputObject(): string {
    let value = '[ ';
    this._value.forEach((object) => {
      value += `${object.isIndirect() ? object.getReference() : object.outputObject()} `;
    });
    value += ']';
    return super.outputObject(value);
  }

  get value(): Array<NullObject | StringObject | BooleanObject | DictionaryObject | NameObject | NumericObject | IntegerObject> {
    return this._value;
  }

  set value(value: Array<NullObject | StringObject | BooleanObject | DictionaryObject | NameObject | NumericObject | IntegerObject>) {
    this._value = value;
  }
}

export default ArrayObject;
