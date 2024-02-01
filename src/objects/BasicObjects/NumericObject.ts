import { ObjectType } from 'enums';
import { INumericObject } from 'interfaces';
import { BaseObject } from 'objects';

export abstract class NumericObject extends BaseObject implements INumericObject {
  private _value: number;

  constructor(value: number, type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    super(type, id, generation);
    this._value = value;
  }

  outputObject(): string {
    return super.outputObject(`${this.value}`);
  }

  get value(): number {
    return this._value;
  }

  set value(value: number) {
    this._value = value;
  }
}

export default NumericObject;
