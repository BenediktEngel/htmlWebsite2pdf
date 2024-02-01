import { ObjectType } from 'enums';
import { INumericObject } from 'interfaces';
import { NumericObject } from 'objects';

export class IntegerObject extends NumericObject implements INumericObject {
  constructor(value: number, type: ObjectType = ObjectType.DIRECT, id?: number, generation?: number) {
    if (!Number.isInteger(value)) throw new Error(`Value ${value} is not an Integer and could therefore not used in an IntegerObject`);
    super(value, type, id, generation);
  }
}

export default IntegerObject;
