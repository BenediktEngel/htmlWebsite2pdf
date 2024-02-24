import { IDictionaryObject } from '../../interfaces';
import type { PDFDocument } from '../../pdfDocument';
import type { ArrayObject } from './ArrayObject';
import { BaseObject } from './BaseObject';
import { BooleanObject } from './BooleanObject';
import { IntegerObject } from './IntegerObject';
import { NameObject } from './NameObject';
import { NullObject } from './NullObject';
import { NumericObject } from './NumericObject';
import { StreamObject } from './StreamObject';
import { StringObject } from './StringObject';

/**
 * DictionaryObject class, used to represent a PDF dictionary object.
 * @class DictionaryObject
 * @implements {IDictionaryObject}
 * @extends {BaseObject}
 */
export class DictionaryObject extends BaseObject implements IDictionaryObject {
  /**
   * The value of the dictionary object.
   * @protected
   */
  protected _value: Map<
    NameObject,
    ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
  >;

  /**
   * Creates an instance of DictionaryObject.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {Map<NameObject, BaseObject>} [value=new Map()]  The value of the dictionary object, defaults to an empty map.
   * @param {boolean} [shouldBeIndirect=false] Whether the object should be indirect or not. Defaults to false.
   */
  constructor(
    pdf: PDFDocument,
    value: Map<
      NameObject,
      ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
    > = new Map(),
    shouldBeIndirect = false,
  ) {
    super(pdf, shouldBeIndirect);
    this._value = value;
  }

  /**
   * Returns a buffer representation of the object which is used to place it in the PDF file
   * @returns {Buffer} The buffer representation of the object
   */
  toBuffer(): Buffer {
    const values = [Buffer.from('<<')];
    this.value.forEach((val, key) => {
      values.push(
        Buffer.from(key.isIndirect() ? key.getReference() : key.toBuffer()),
        Buffer.from(' '),
        Buffer.from(val.isIndirect() ? val.getReference() : val.toBuffer()),
        Buffer.from(' '),
      );
    });
    return super.toBuffer(Buffer.concat([...values, Buffer.from('>>')]));
  }

  /**
   * Get the value of an dictionary-entry by key
   * @param {NameObject | string} key The key of the entry
   * @returns {BaseObject | undefined} The value of the entry or undefined if the key does not exist
   */
  getValueByKey(key: NameObject | string): BaseObject | undefined {
    if (key instanceof NameObject) {
      return this._value.get(key);
    }
    const name = NameObject.getName(key);
    return name ? this._value.get(name) : undefined;

    // const name = key instanceof NameObject ? key : NameObject.getName(key);
    // return this._value.get(name);
  }

  /**
   * Set the value of an dictionary-entry by key
   * @param {NameObject | string} key The key of the entry
   * @param {BaseObject} value The value of the entry
   */
  setValueByKey(
    key: NameObject | string,
    value: ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject,
  ): void {
    if (key instanceof NameObject) {
      this._value.set(key, value);
      return;
    }
    const name = NameObject.getName(key);
    if (name) {
      this._value.set(name, value);
    } else {
      this._value.set(new NameObject(this.pdfDocument, key), value);
    }
  }

  /**
   * Returns the value of the dictionary object
   * @returns {Map<NameObject, BaseObject>} The value of the dictionary object
   */
  get value(): Map<
    NameObject,
    ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
  > {
    return this._value;
  }

  /**
   * Sets the value of the dictionary object
   * @param {Map<NameObject, BaseObject>} value The new value of the dictionary object
   */
  set value(
    value: Map<
      NameObject,
      ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
    >,
  ) {
    this._value = value;
  }
}

export default DictionaryObject;
