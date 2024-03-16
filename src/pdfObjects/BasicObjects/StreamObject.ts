import { IStreamObject } from '../../interfaces';
import { BaseObject } from './BaseObject';
import type { PDFDocument } from '../../pdfDocument';
import type { DictionaryObject } from './DictionaryObject';
import { IntegerObject } from './IntegerObject';
import { NameObject } from './NameObject';
import zlib from 'zlib';

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
  protected _value: string | Buffer;

  /**
   * The stream dictionary of the stream object.
   */
  streamDictionary: DictionaryObject;

  /**
   * Creates an instance of StreamObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {string} value The value of the stream object.
   * @param {DictionaryObject} [streamDictionary] The stream dictionary of the stream object.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(pdf: PDFDocument, value: string | Buffer, streamDictionary: DictionaryObject, shouldBeIndirect = false) {
    super(pdf, shouldBeIndirect);
    this._value = value;
    this.streamDictionary = streamDictionary;
  }

  /**
   * Returns a Buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The Buffer representation of the object
   */
  toBuffer(): Buffer {
    let streamBuffer = Buffer.from(this._value);
    if (!this.streamDictionary.getValueByKey('Filter')) {
      streamBuffer = zlib.deflateSync(streamBuffer);
      this.streamDictionary.setValueByKey('Filter', NameObject.getName(this.pdfDocument, 'FlateDecode'));
    }
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
   * @returns {string | Buffer} The value of the stream object
   */
  get value(): string | Buffer {
    return this._value;
  }

  /**
   * Sets the value of the stream object
   * @param {string | Buffer} value The new value of the stream object
   */
  set value(value: string | Buffer) {
    this._value = value;
  }
}

export default StreamObject;
