import { IStreamObject } from '../../interfaces';
import { BaseObject } from './BaseObject';
import { DictionaryObject } from './DictionaryObject';
import { PDFDocument } from '../../pdfDocument';

/**
 * Class representing a stream object, used to represent a stream in a PDF document.
 * @class StreamObject
 * @implements {IStreamObject}
 * @extends {BaseObject}
 */
export class StreamObject extends BaseObject implements IStreamObject {
  /**
   * The value of the stream object.
   * @private
   */
  protected _value: string;

  /**
   * The stream dictionary of the stream object.
   */
  streamDictionary: DictionaryObject;

  /**
   * Creates an instance of StreamObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {string} value The value of the stream object.
   * @param {DictionaryObject} [streamDictionary=new DictionaryObject()] The stream dictionary of the stream object.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: string, streamDictionary = new DictionaryObject(pdf, new Map()), shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
    this.streamDictionary = streamDictionary;
    // TODO: Probably call method to calculate length of stream
    // TODO: And set this value in the stream dictionary
  }

  /**
   * Returns a string representation of the object which is used to place it in the PDF file
   * @returns {string} The string representation of the object
   */
  toString(): string {
    return super.toString(
      `${this.streamDictionary.isIndirect() ? this.streamDictionary.getReference() : this.streamDictionary.toString()}\rstream\r${
        this._value
      }\rendstream`,
    );
  }

  /**
   * Returns the value of the stream object
   * @returns {string} The value of the stream object
   */
  get value(): string {
    return this._value;
  }

  /**
   * Sets the value of the stream object
   * @param {string} value The new value of the stream object
   */
  set value(value: string) {
    this._value = value;
  }
}

export default StreamObject;
