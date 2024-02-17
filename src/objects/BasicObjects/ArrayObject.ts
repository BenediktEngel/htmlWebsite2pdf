import { IArrayObject } from '../../interfaces';
import { PDFDocument } from '../../pdfDocument';
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
   * Returns a string representation of the object which is used to place it in the PDF file
   * @returns {string} The string representation of the object
   */
  toString(): string {
    let value = '[';
    this._value.forEach((object) => {
      value += `${object.isIndirect() ? object.getReference() : object.toString()} `;
    });
    value = value.trimEnd();
    value += ']';
    return super.toString(value);
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
}

export default ArrayObject;
