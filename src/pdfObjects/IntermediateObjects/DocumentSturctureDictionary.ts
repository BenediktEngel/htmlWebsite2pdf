import { IDocumentStructureDictionary } from '../../interfaces';
import { TOptionalValue, TRequiredValue } from '../../types';
import type { PDFDocument } from '../../pdfDocument';
import { NameObject } from '../BasicObjects/NameObject';
import { ArrayObject } from '../BasicObjects/ArrayObject';
import { BooleanObject } from '../BasicObjects/BooleanObject';
import { DictionaryObject } from '../BasicObjects/DictionaryObject';
import { IntegerObject } from '../BasicObjects/IntegerObject';
import { NullObject } from '../BasicObjects/NullObject';
import { NumericObject } from '../BasicObjects/NumericObject';
import { StreamObject } from '../BasicObjects/StreamObject';
import { StringObject } from '../BasicObjects/StringObject';

// TODO: Maybe change requiredValues, optionalValues, etc. to a Map and the name to Entry instead of value

/**
 * Class representing a dictionary which is used in the document structure, therefore it has requiered and optional values.
 * @class DocumentStructureDictionary
 * @implements {IDocumentStructureDictionary}
 * @extends {DictionaryObject}
 * @abstract
 */
export abstract class DocumentStructureDictionary extends DictionaryObject implements IDocumentStructureDictionary {
  /**
   * The requiered values of the dictionary object.
   * @readonly
   */
  readonly requieredValues: Array<TRequiredValue> = [];

  /**
   * The optional values of the dictionary object.
   * @readonly
   */
  readonly optionalValues: Array<TOptionalValue> = [];

  /**
   * Creates an instance of DocumentStructureDictionary.
   * @constructor
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {Map<NameObject, BaseObject>} [value=new Map()] The value of the dictionary object, defaults to an empty map.
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
    super(pdf, value, shouldBeIndirect);
    // TODO: Maybe delete the values from the arrays which are not applicable for the version of the PDF document, that would save a lot of functions and runtime for checks
  }

  /**
   * Checks if all requiered values are set
   * @returns {boolean} Whether all requiered values are set or not
   */
  requieredValuesSet(): boolean {
    if (this.requieredValues.length === 0) return true;
    return !this.getRequiredValuesByVersion()
      .filter((val) => val.exception === undefined || val.exception() === false)
      .some((value) => this.getValueByKey(value.name) !== undefined); // TODO Maybe check hier for empty value
  }

  /**
   * Get the requiered values of the dictionary object which are applicable for the version of the PDF document
   * @returns {Array<TRequiredValue>} The requiered values of the dictionary object
   */
  getRequiredValuesByVersion(): Array<TRequiredValue> {
    return this.requieredValues.filter((val) => this.isValueApplicableByVersion(val));
  }

  /**
   * Get the optional values of the dictionary object which are applicable for the version of the PDF document
   * @returns {Array<TOptionalValue>} The optional values of the dictionary object
   */
  getOptionalValuesByVersion(): Array<TOptionalValue> {
    return this.optionalValues.filter((val) => this.isValueApplicableByVersion(val));
  }

  /**
   * Checks if a required or optional value is applicable for the version of the PDF document
   * @param {TRequiredValue | TOptionalValue} value The value to check
   */
  isValueApplicableByVersion(value: TRequiredValue | TOptionalValue): boolean {
    // TODO: we need a working check for the versionnumber, cause its an enum
    return value.minVersion === undefined || value.minVersion >= this.pdfDocument.version;
  }

  /**
   * Checks if the key is applicable for the Dictionary and for the version of the PDF document
   * @param {NameObject | string} key The key to check
   * @returns {boolean} Whether the key is applicable or not
   */
  isValueApplicable(key: string | NameObject): boolean {
    const stringKey = key instanceof NameObject ? key.value : key;
    return (
      this.getRequiredValuesByVersion().some((value) => value.name === stringKey) ||
      this.getOptionalValuesByVersion().some((value) => value.name === stringKey)
    );
  }
}

export default DocumentStructureDictionary;
