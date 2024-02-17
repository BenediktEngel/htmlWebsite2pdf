import { IDictionaryObject } from '../../interfaces';
import { ArrayObject, BaseObject, BooleanObject, IntegerObject, NameObject, NullObject, NumericObject, StreamObject, StringObject } from './index';
import { PDFDocument } from '../../pdfDocument';

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
   * Returns a string representation of the object which is used to place it in the PDF file
   * @returns {string} The string representation of the object
   */
  toString(): string {
    let value = '<< ';
    this.value.forEach((val, key) => {
      value += `${key.isIndirect() ? key.getReference() : key.toString()} ${val.isIndirect() ? val.getReference() : val.toString()} `;
    });
    value += '>>';
    return super.toString(value);
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
      return;
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
