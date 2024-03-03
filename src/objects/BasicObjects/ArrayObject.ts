import type { IArrayObject } from '../../interfaces';
import type { PDFDocument } from '../../pdfDocument';
import { BaseObject } from './BaseObject';

/**
 * Class representing a PDF array object
 * @class ArrayObject
 * @implements {IArrayObject}
 * @extends {BaseObject}
 */
export class ArrayObject extends BaseObject implements IArrayObject {
  /**
   * The value of the array object
   * @protected
   */
  protected _value: Array<BaseObject>;

  /**
   * Creates an instance of ArrayObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {Array<BaseObject>} [value=[]] The initial value of the array, defaults to an empty array
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: Array<BaseObject> = [], shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
  }

  /**
   * Returns a Buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The Buffer representation of the object
   */
  toBuffer(): Buffer {
    const values = [Buffer.from('[')];
    this._value.forEach((object) => {
      values.push(object.isIndirect() ? Buffer.from(object.getReference()) : object.toBuffer(), Buffer.from(' '));
    });
    values.push(Buffer.from(']'));
    return super.toBuffer(Buffer.concat(values));
  }

  /**
   * Returns the value of the object
   * @returns {Array<BaseObject>} The value of the object
   */
  get value(): Array<BaseObject> {
    return this._value;
  }

  /**
   * Sets the value of the object
   * @param {Array<BaseObject>} value The new value of the object
   */
  set value(value: Array<BaseObject>) {
    this._value = value;
  }

  /**
   * Push an object to the end of the array
   * @param {BaseObject} object  The object to push into the array
   * @returns {number} The length of the array
   */
  push(object: BaseObject): void {
    this._value.push(object);
  }

  /**
   * Pop an object from the end of the array
   * @returns {BaseObject | undefined} The object that was popped from the array or undefined if the array is empty
   */
  pop(): BaseObject | undefined {
    return this._value.pop();
  }

  /**
   * Get the length of the array
   * @returns {number} the length of the array
   */
  get length(): number {
    return this._value.length;
  }

  /**
   * Get the object at a specific index
   * @param {number} index The index of the object
   * @returns {BaseObject | undefined} The object at the index or undefined if the index is out of range
   */
  getAt(index: number): BaseObject | undefined {
    return this._value[index];
  }

  /**
   * Set the object at a specific index
   * @param {number} index The index of the object
   * @param {BaseObject} object The object to set at the index
   */
  setAt(index: number, object: BaseObject): void {
    if (index > this._value.length) {
      throw new Error('Index out of range');
    }
    this._value[index] = object;
  }
}

export default ArrayObject;
