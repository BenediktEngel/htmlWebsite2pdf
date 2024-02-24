import { INullObject } from '../../interfaces';
import { BaseObject } from './BaseObject';

/**
 * NullObject class, used to represent a null object in a PDF document.
 * @class NullObject
 * @implements {INullObject}
 * @extends {BaseObject}
 */
export class NullObject extends BaseObject implements INullObject {
  /**
   * The value of the null object, which is always null.
   * @private
   */
  protected _value = null;

  /**
   * Returns a buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The buffer representation of the object
   */
  toBuffer(): Buffer {
    return super.toBuffer(Buffer.from('null'));
  }

  /**
   * Returns the value of the object
   * @returns {null} The value of the object
   */
  get value(): null {
    return this._value;
  }
}

export default NullObject;
