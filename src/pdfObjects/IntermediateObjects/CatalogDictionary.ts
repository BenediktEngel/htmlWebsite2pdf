import { NameObject } from '../BasicObjects/NameObject';
import { ArrayObject } from '../BasicObjects/ArrayObject';
import { BooleanObject } from '../BasicObjects/BooleanObject';
import { DictionaryObject } from '../BasicObjects/DictionaryObject';
import { IntegerObject } from '../BasicObjects/IntegerObject';
import { NullObject } from '../BasicObjects/NullObject';
import { NumericObject } from '../BasicObjects/NumericObject';
import { StreamObject } from '../BasicObjects/StreamObject';
import { StringObject } from '../BasicObjects/StringObject';
import type { PDFDocument } from '../../pdfDocument';

/**
 * Class representing a Catalog object in a PDF document.
 * @class Catalog
 * @extends {DictionaryObject}
 */
export class CatalagDictionary extends DictionaryObject {
  /**
   * Creates an instance of Catalog.
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
    const tempValue = value;
    tempValue.set(NameObject.getName(pdf, 'Type'), NameObject.getName(pdf, 'Catalog'));
    super(pdf, value, shouldBeIndirect);
  }
}

export default CatalagDictionary;
