import { ObjectType, StringType } from 'enums';
import { IStringObject } from 'interfaces';
import { BaseObject } from 'objects';

export class StringObject extends BaseObject implements IStringObject {
private  _value: string;

  readonly stringType: StringType;

  constructor(value: string, stringType = StringType.LITERAL, type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    super(type, id, generation);
    this._value = value;
    this.stringType = stringType;
  }

  outputObject(): string {
    return super.outputObject(this.stringType === StringType.HEXADECIMAL ? `<${this.value}>` : `(${this.value})`);
  }

  get value(): string {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }
}

export default StringObject;
