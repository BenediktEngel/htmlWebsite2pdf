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

  static getName(pdf: PDFDocument, name: string): NameObject {
    const found = NameObject.allNames.get(name);
    return found || new NameObject(pdf, name);
  }

  /**
   * Creates an instance of NameObject. Use the static method `getName` to create a new instance of NameObject, as it will check if the name already exists.
   * @constructor
   * @private
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {string} value The value of the name object.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   * @throws {Error} If the value is an empty string
   */
  private constructor(pdf: PDFDocument, value: string, shouldBeIndirect = false) {
    if (value === '') {
      throw new Error('Name object cannot be empty');
    }
    super(pdf, shouldBeIndirect);
    this._value = value.replace(' ', '#20');
    NameObject.allNames.set(this._value, this);
  }

  /**
   * Returns a Buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The Buffer representation of the object
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
}

export default NameObject;
