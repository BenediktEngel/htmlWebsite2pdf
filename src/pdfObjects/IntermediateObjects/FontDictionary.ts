import { BaseObjects, IntermediateObject, PdfVersion } from '../../enums';
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
export class FontDictionary extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  // TODO: Add the requiered values and optional values for other font types, these only include Typ1 and TrueType
  /**
   * The requiered values of the dictionary object.
   * @readonly
   */
  readonly requieredValues: Array<TRequiredValue> = [
    { name: 'Type', type: BaseObjects.NAME },
    { name: 'Subtype', type: BaseObjects.NAME },
    { name: 'BaseFont', type: BaseObjects.NAME },
    { name: 'Name', type: BaseObjects.NAME, exception: () => this.pdfDocument.version === PdfVersion.V1_0 },
    { name: 'FirstChar', type: BaseObjects.INTEGER }, // Maybe except for standardfonts, but only until v1.5
    { name: 'LastChar', type: BaseObjects.INTEGER }, // Maybe except for standardfonts, but only until v1.5
    { name: 'Widths', type: BaseObjects.ARRAY }, // Maybe except for standardfonts, but only until v1.5
    { name: 'FontDescriptor', type: BaseObjects.DICTIONARY }, // -> FontDescriptor Dictionary
  ];

  /**
   * The optional values of the dictionary object.
   * @readonly
   */
  readonly optionalValues: Array<TOptionalValue> = [
    { name: 'Encoding', type: [BaseObjects.NAME, BaseObjects.DICTIONARY] },
    { name: 'ToUnicode', type: BaseObjects.STREAM },
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
    value.set(NameObject.getName(pdf, 'Type'), NameObject.getName(pdf, 'Font'));
    super(pdf, value, shouldBeIndirect);
  }
}

export default FontDictionary;
