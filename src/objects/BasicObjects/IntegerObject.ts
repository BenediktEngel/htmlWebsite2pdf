import { INumericObject } from '../../interfaces';
import { NumericObject } from './NumericObject';
import type { PDFDocument } from '../../pdfDocument';

/**
 * IntegerObject class, used to represent an IntegerObject in a PDFDocument
 * @class IntegerObject
 * @extends NumericObject
 * @implements INumericObject
 */
export class IntegerObject extends NumericObject implements INumericObject {
  /**
   * Creates an instance of IntegerObject.
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {number} value The value of the IntegerObject
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   * @throws {Error} If the value is not an integer
   */
  constructor(pdf: PDFDocument, value: number, shouldBeIndirect = false) {
    if (!Number.isInteger(value)) throw new Error(`Value ${value} is not an Integer and could therefore not used in an IntegerObject`);
    super(pdf, value, shouldBeIndirect);
  }

  /**
   * Set the value of the object to a new value
   * @param {number} value The new value of the object
   * @throws {Error} If the value is not an integer
   */
  set value(value: number) {
    if (!Number.isInteger(value)) throw new Error(`Value ${value} is not an Integer and could therefore not used in an IntegerObject`);
    this._value = value;
  }
}

export default IntegerObject;
