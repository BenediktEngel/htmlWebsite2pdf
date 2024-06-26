import { INumericObject } from '../../interfaces';
import { BaseObject } from './BaseObject';
import type { PDFDocument } from '../../pdfDocument';

/**
 * NumericObject class, used to represent a numeric object in a PDF document.
 * @class NumericObject
 * @implements {INumericObject}
 * @extends {BaseObject}
 */
export class NumericObject extends BaseObject implements INumericObject {
  /**
   * The value of the numeric object.
   * @protected
   */
  protected _value: number;

  /**
   * Creates an instance of NumericObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {number} value The value of the numeric object.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: number, shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
  }

  /**
   * Returns a Buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The Buffer representation of the object
   */
  toBuffer(): Buffer {
    return super.toBuffer(Buffer.from(`${this._value}`));
  }

  /**
   * Returns the value of the object
   * @returns {number} The value of the object
   */
  get value(): number {
    return this._value;
  }

  /**
   * Sets the value of the object
   * @param {number} value The new value of the object
   */
  set value(value: number) {
    this._value = value;
  }
}

export default NumericObject;
