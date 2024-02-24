import { StringType } from '../../enums';
import { IStringObject } from '../../interfaces';
import type { PDFDocument } from '../../pdfDocument';
import { BaseObject } from './BaseObject';

/**
 * StringObject class, used to represent a string object in a PDF document.
 * @class StringObject
 * @implements {IStringObject}
 * @extends {BaseObject}
 */
export class StringObject extends BaseObject implements IStringObject {
  /**
   * The value of the string object.
   * @private
   */
  protected _value: string;

  /**
   * The type of the string object.
   * @readonly
   */
  readonly stringType: StringType;

  /**
   * Creates an instance of StringObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {string} value The value of the string object.
   * @param {StringType} [stringType=StringType.LITERAL] The type of the string object. Defaults to literal.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: string, stringType = StringType.LITERAL, shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
    this.stringType = stringType;
  }

  /**
   * Returns a buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The buffer representation of the object
   */
  toBuffer(): Buffer {
    return super.toBuffer(Buffer.from(this.stringType === StringType.HEXADECIMAL ? `<${this.value}>` : `(${this.value})`));
  }

  /**
   * Returns the value of the object
   * @returns {string} The value of the object
   */
  get value(): string {
    return this._value;
  }

  /**
   * Sets the value of the object
   * @param {string} value The new value of the object
   */
  set value(value: string) {
    this._value = value;
  }
}

export default StringObject;
