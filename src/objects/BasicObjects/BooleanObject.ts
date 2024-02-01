import { ObjectType } from 'enums';
import { IBooleanObject } from 'interfaces';
import { BaseObject } from 'objects';

export class BooleanObject extends BaseObject implements IBooleanObject {
private  _value: boolean;

  constructor(value: boolean, type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    super(type, id, generation);
    this._value = value;
  }

  outputObject(): string {
    return super.outputObject(`${this._value}`);
  }

  get value(): boolean {
    return this._value;
  }

  set value(value: boolean) {
    this._value = value;
  }
}

export default BooleanObject;
