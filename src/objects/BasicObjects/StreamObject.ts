import { IStreamObject } from '../../interfaces';
import { BaseObject } from './BaseObject';
import type { PDFDocument } from '../../pdfDocument';
import type { DictionaryObject } from './DictionaryObject';
import { IntegerObject } from './IntegerObject';

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
   * @param {DictionaryObject} [streamDictionary] The stream dictionary of the stream object. // TODO: this is not optional anymore
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: string, streamDictionary: DictionaryObject, shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
    this.streamDictionary = streamDictionary;
    // TODO: Probably call method to calculate length of stream
    // TODO: And set this value in the stream dictionary
  }

  /**
   * Returns a buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The buffer representation of the object
   */
  toBuffer(): Buffer {
    const streamBuffer = Buffer.from(this._value);
    const streamSize = streamBuffer.byteLength;
    this.streamDictionary.setValueByKey('Length', new IntegerObject(this.pdfDocument, streamSize));
    return super.toBuffer(
      Buffer.concat([
        this.streamDictionary.isIndirect() ? Buffer.from(this.streamDictionary.getReference()) : this.streamDictionary.toBuffer(),
        Buffer.from('\r\nstream\r\n'),
        streamBuffer,
        Buffer.from('\r\nendstream'),
      ]),
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
