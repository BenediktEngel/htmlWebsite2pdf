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
export class FontDescriptorDictionary extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  /**
   * The requiered values of the dictionary object.
   * @readonly
   */
  readonly requieredValues: Array<TRequiredValue> = [
    { name: 'FontName', type: BaseObjects.NAME },
    { name: 'Flags', type: BaseObjects.INTEGER },
    { name: 'FontBBox', type: IntermediateObject.RECTANGLE },
    { name: 'ItalicAngle', type: BaseObjects.NUMERIC },
    { name: 'Ascent', type: BaseObjects.NUMERIC },
    { name: 'Descent', type: BaseObjects.NUMERIC },
    { name: 'CapHeight', type: BaseObjects.NUMERIC },
    { name: 'StemV', type: BaseObjects.NUMERIC },
  ];

  /**
   * The optional values of the dictionary object.
   * @readonly
   */
  readonly optionalValues: Array<TOptionalValue> = [
    { name: 'FontFamily', type: BaseObjects.STRING }, // TODO: ByteString
    { name: 'FontStretch', type: BaseObjects.NAME },
    { name: 'FontWeight', type: BaseObjects.NAME },
    { name: 'Leading', type: BaseObjects.NUMERIC },
    { name: 'XHeight', type: BaseObjects.NUMERIC },
    { name: 'StemH', type: BaseObjects.NUMERIC },
    { name: 'AvgWidth', type: BaseObjects.NUMERIC },
    { name: 'MaxWidth', type: BaseObjects.NUMERIC },
    { name: 'MissingWidth', type: BaseObjects.NUMERIC },
    { name: 'FontFile', type: BaseObjects.STREAM },
    { name: 'FontFile2', type: BaseObjects.STREAM },
    { name: 'FontFile3', type: BaseObjects.STREAM },
    { name: 'CharSet', type: BaseObjects.STRING }, // TODO: ByteString or ASCIIString
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
    value.set(new NameObject(pdf, 'Type'), new NameObject(pdf, 'FontDescriptor'));
    super(pdf, value, shouldBeIndirect);
  }
}

export default FontDescriptorDictionary;
