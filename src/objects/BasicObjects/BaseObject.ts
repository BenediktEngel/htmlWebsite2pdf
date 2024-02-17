import { IBaseObject } from '../../interfaces';
import { PDFDocument } from '../../pdfDocument';

/**
 * Base class for all PDF objects
 * @class
 * @abstract
 * @implements IBaseObject
 */
export abstract class BaseObject implements IBaseObject {
  /**
   * Object ID if object is indirect
   * @private
   */
  private _id: number | undefined = undefined;

  /**
   * Object generation if object is indirect
   * @private
   */
  private _generation: number | undefined = undefined;

  /**
   * The PDF document the object belongs to
   * @readonly
   */
  readonly pdfDocument: PDFDocument;

  /**
   * Create new BaseObject instance
   * @constructor
   * @param {PDFDocument} pdf The PDF document the object belongs to
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, shouldBeIndirect = false) {
    this.pdfDocument = pdf;
    if (shouldBeIndirect) {
      this.toIndirect();
    }
  }

  /**
   * Check if object is indirect
   * @returns {boolean} Whether the object is indirect or not
   */
  isIndirect() {
    return this._id !== undefined;
  }

  /**
   * Transform an direct object into an indirect object
   * @param {number} generation - Object generation, defaults to 0
   * @returns {void}
   * @throws {Error} - If object is already indirect
   */
  toIndirect(generation = 0) {
    if (this.isIndirect()) {
      throw new Error('Object is already indirect');
    }
    this._id = this.pdfDocument.addIndirectObject(this, generation);
    this._generation = generation;
  }

  /**
   * Returns a string representation of the object which is used to place it in the PDF file
   * @param {string} value - The value of the subclass
   * @returns {string} The string representation of the object
   */
  toString(value?: string): string {
    if (this.isIndirect()) {
      return `${this.id} ${this.generation} obj\r${value}\rendobj`;
    }
    return value || '';
  }

  /**
   * Returns the reference of the object for adding it to the PDF if it is indirect
   * @returns {string} The reference of the object
   * @throws {Error} - If object is not indirect
   */
  getReference(): string {
    if (!this.isIndirect()) {
      throw new Error('Object is not indirect');
    }
    return `${this.id} ${this.generation} R`;
  }

  /**
   * Returns the object ID if the object is indirect
   * @returns {number} The object ID
   * @throws {Error} - If object is not indirect
   */
  get id(): number | undefined {
    if (!this.isIndirect()) {
      throw new Error('Object is not indirect');
    }
    return this._id;
  }

  /**
   * Returns the object generation if the object is indirect
   * @returns {number} The object generation
   * @throws {Error} - If object is not indirect
   */
  get generation(): number | undefined {
    if (!this.isIndirect()) {
      throw new Error('Object is not indirect');
    }
    return this._generation;
  }
}

export default BaseObject;
