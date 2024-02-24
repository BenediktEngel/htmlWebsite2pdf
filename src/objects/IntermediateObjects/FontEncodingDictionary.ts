import { BaseObjects, IntermediateObject } from '../../enums';
import { IDocumentStructureDictionary } from '../../interfaces';
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
import { DocumentStructureDictionary } from './DocumentSturctureDictionary';
import { TOptionalValue, TRequiredValue } from '../../types';

/**
 * Class representing a PageTree object in a PDF document.
 * @class PageTree
 * @extends {DocumentStructureDictionary}
 * @implements {IDocumentStructureDictionary}
 */
export class FontEncodingDictionary extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  /**
   * The requiered values of the dictionary object.
   * @readonly
   */
  readonly requieredValues: Array<TRequiredValue> = [{ name: 'Type', type: BaseObjects.NAME }];

  /**
   * The optional values of the dictionary object.
   * @readonly
   */
  readonly optionalValues: Array<TOptionalValue> = [
    { name: 'BaseEncoding', type: BaseObjects.NAME },
    { name: 'Differences', type: BaseObjects.ARRAY },
  ];

  /**
   * Creates an instance of PageTree.
   * @param {PDFDocument} pdf The PDF document to which the object belongs to
   * @param {Map({NameObject, ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject})} [value=new Map()] The value of the dictionary object, defaults to an empty map.
   * @param {boolean} [shouldBeIndirect=false] Wheter the object should be indirect or not, defaults to false.
   * @constructor
   */
  constructor(
    pdf: PDFDocument,
    value: Map<
      NameObject,
      ArrayObject | BooleanObject | DictionaryObject | IntegerObject | NameObject | NullObject | NumericObject | StreamObject | StringObject
    > = new Map(),
    shouldBeIndirect = false,
  ) {
    value.set(new NameObject(pdf, 'Type'), new NameObject(pdf, 'Encoding'));
    super(pdf, value, shouldBeIndirect);
  }
}

export default FontEncodingDictionary;
