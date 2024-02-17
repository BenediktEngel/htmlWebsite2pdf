import { BaseObjects, PdfVersion, IntermediateObject } from '../../enums';
import { IDocumentStructureDictionary } from '../../interfaces';
import {
  NameObject,
  ArrayObject,
  BooleanObject,
  DictionaryObject,
  IntegerObject,
  NullObject,
  NumericObject,
  StreamObject,
  StringObject,
} from '../BasicObjects';
import { DocumentStructureDictionary } from './DocumentSturctureDictionary';
import { PDFDocument } from '../../pdfDocument';
import { TRequiredValue, TOptionalValue } from '../../types';

/**
 * Class representing a Catalog object in a PDF document.
 * @class Catalog
 * @extends {DocumentStructureDictionary}
 * @implements {IDocumentStructureDictionary}
 */
export class CatalagDictionary extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  /**
   * The requiered values of the dictionary object.
   * @readonly
   */
  readonly requieredValues: Array<TRequiredValue> = [
    { name: 'Type', type: BaseObjects.NAME },
    { name: 'Pages', type: IntermediateObject.PAGES },
  ];

  /**
   * The optional values of the dictionary object.
   * @readonly
   */
  readonly optionalValues: Array<TOptionalValue> = [
    { name: 'Version', type: BaseObjects.NAME },
    { name: 'Extensions', type: BaseObjects.DICTIONARY },
    // {name: 'PageLabels' , type: , minVersion: PdfVersions.V1_3}, // TODO: type is numbertree
    { name: 'Names', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_2 },
    { name: 'Dests', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_1 },
    { name: 'ViewerPreferences', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_2 },
    { name: 'PageLayout', type: BaseObjects.NAME },
    { name: 'PageMode', type: BaseObjects.NAME },
    { name: 'Outlines', type: BaseObjects.DICTIONARY },
    { name: 'Threads', type: BaseObjects.ARRAY, minVersion: PdfVersion.V1_1 },
    { name: 'OpenAction', type: [BaseObjects.DICTIONARY, BaseObjects.ARRAY], minVersion: PdfVersion.V1_1 },
    { name: 'AA', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_4 },
    { name: 'URI', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_1 },
    { name: 'AcroForm', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_2 },
    { name: 'Metadata', type: BaseObjects.STREAM, minVersion: PdfVersion.V1_4 },
    { name: 'StructTreeRoot', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_3 },
    { name: 'MarkInfo', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_4 },
    { name: 'Lang', type: BaseObjects.STRING, minVersion: PdfVersion.V1_4 },
    { name: 'SpiderInfo', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_3 },
    { name: 'OutputIntents', type: BaseObjects.ARRAY, minVersion: PdfVersion.V1_4 },
    { name: 'PieceInfo', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_4 },
    { name: 'OCProperties', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_5 },
    { name: 'Perms', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_5 },
    { name: 'Legal', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_5 },
    { name: 'Requirements', type: BaseObjects.ARRAY, minVersion: PdfVersion.V1_7 },
    { name: 'Collection', type: BaseObjects.DICTIONARY, minVersion: PdfVersion.V1_7 },
    { name: 'NeedsRendering', type: BaseObjects.BOOLEAN, minVersion: PdfVersion.V1_7 },
  ];

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
    super(pdf, value, shouldBeIndirect);
  }
}

export default CatalagDictionary;
