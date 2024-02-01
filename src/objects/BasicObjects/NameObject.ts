import { ObjectType } from 'enums';
import { INameObject } from 'interfaces';
import { BaseObject } from 'objects';

export class NameObject extends BaseObject implements INameObject {
private  _value: string;

  constructor(value: string, type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    super(type, id, generation);
    this._value = value;
  }

  outputObject(): string {
    return super.outputObject(`/${this.value}`);
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }
}

export default NameObject;
