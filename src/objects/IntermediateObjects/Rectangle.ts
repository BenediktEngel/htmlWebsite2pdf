import { ArrayObject, IntegerObject } from 'objects';
import { IRectangle } from 'interfaces';
import { ObjectType } from 'enums';

export class Rectangle extends ArrayObject implements IRectangle {
  // Value is set by super class
  _value!: Array<IntegerObject>;

  constructor(
    lowerLeftX: number,
    lowerLeftY: number,
    upperLeftX: number,
    upperLeftY: number,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    const value = [new IntegerObject(lowerLeftX), new IntegerObject(lowerLeftY), new IntegerObject(upperLeftX), new IntegerObject(upperLeftY)];
    super(value, type, id, generation);
  }

  get value(): Array<IntegerObject> {
    return this._value;
  }

  set value(value: Array<IntegerObject>) {
    this._value = value;
  }
}

export default Rectangle;
