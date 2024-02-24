import { IBooleanObject } from '../../interfaces';
import { BaseObject } from './BaseObject';
import type { PDFDocument } from '../../pdfDocument';

/**
 * BooleanObject class, used to represent a boolean object in a PDF document.
 * @class BooleanObject
 * @implements {IBooleanObject}
 * @extends {BaseObject}
 */
export class BooleanObject extends BaseObject implements IBooleanObject {
  /**
   * The value of the boolean object.
   * @private
   */
  protected _value: boolean;

  /**
   * Creates an instance of BooleanObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {boolean} value The value of the boolean object.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: boolean, shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
  }

  /**
   * Returns a buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The buffer representation of the object
   */
  toBuffer(): Buffer {
    return super.toBuffer(Buffer.from(`${this._value}`));
  }

  /**
   * Returns the value of the object
   * @returns {boolean} The value of the object
   */
  get value(): boolean {
    return this._value;
  }

  /**
   * Sets the value of the object
   * @param {boolean} value The new value of the object
   */
  set value(value: boolean) {
    this._value = value;
  }
}

export default BooleanObject;
