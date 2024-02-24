import { INameObject } from '../../interfaces';
import { BaseObject } from './BaseObject';
import type { PDFDocument } from '../../pdfDocument';

/**
 * NameObject class, used to represent a name object in a PDF document.
 * @class NameObject
 * @implements {INameObject}
 * @extends {BaseObject}
 */
export class NameObject extends BaseObject implements INameObject {
  /**
   * The value of the name object.
   * @private
   */
  protected _value: string;

  static allNames: Map<string, NameObject> = new Map();

  static getName(name: string): NameObject | undefined {
    return NameObject.allNames.get(name);
  }

  /**
   * Creates an instance of NameObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {string} value The value of the name object.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   * @throws {Error} If the value is an empty string
   */
  constructor(pdf: PDFDocument, value: string, shouldBeIndirect = false) {
    if (value === '') {
      throw new Error('Name object cannot be empty');
    }
    super(pdf, shouldBeIndirect);
    this._value = value.replace(' ', '#20');
    NameObject.allNames.set(this._value, this);
  }

  /**
   * Returns a buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The buffer representation of the object
   */
  toBuffer(): Buffer {
    return super.toBuffer(Buffer.from(`/${this.value}`));
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
   * @throws {Error} If the value is an empty string
   */
  set value(value: string) {
    if (value === '') {
      throw new Error('Name object cannot be empty');
    }
    this._value = value.replace(' ', '');
  }
}

export default NameObject;
