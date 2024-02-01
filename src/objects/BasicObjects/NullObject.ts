import { INullObject } from 'interfaces';
import { BaseObject } from 'objects';

export class NullObject extends BaseObject implements INullObject {
  _value = null;

  outputObject(): string {
    return super.outputObject('null');
  }

  get value(): null {
    return this._value;
  }

  set value(value: null) {
    this._value = value;
  }
}

export default NullObject;
