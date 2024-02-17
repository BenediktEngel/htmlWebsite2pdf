import { BaseObjects, IntermediateObject } from '../../enums';
import { IDocumentStructureDictionary } from '../../interfaces';
import {
  ArrayObject,
  BaseObject,
  BooleanObject,
  DictionaryObject,
  IntegerObject,
  NameObject,
  NullObject,
  NumericObject,
  StreamObject,
  StringObject,
} from '../BasicObjects';
import { DocumentStructureDictionary } from './DocumentSturctureDictionary';
import { PDFDocument } from '../../pdfDocument';
import { TOptionalValue, TRequiredValue } from '../../types';

/**
 * Class representing a PageTree object in a PDF document.
 * @class PageTree
 * @extends {DocumentStructureDictionary}
 * @implements {IDocumentStructureDictionary}
 */
export class PageTree extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  /**
   * The requiered values of the dictionary object.
   * @readonly
   */
  readonly requieredValues: Array<TRequiredValue> = [
    { name: 'Type', type: BaseObjects.NAME },
    { name: 'Kids', type: BaseObjects.ARRAY },
    { name: 'Count', type: BaseObjects.NUMERIC },
    { name: 'Parent', type: BaseObjects.DICTIONARY, exception: () => this.pdfDocument.root !== this },
  ];

  /**
   * The optional values of the dictionary object.
   * @readonly
   */
  readonly optionalValues: Array<TOptionalValue> = [
    { name: 'LastModified', type: BaseObjects.STRING }, // TODO: Date
    { name: 'Resources', type: BaseObjects.DICTIONARY },
    { name: 'MediaBox', type: IntermediateObject.RECTANGLE },
    { name: 'CropBox', type: IntermediateObject.RECTANGLE },
    { name: 'BleedBox', type: IntermediateObject.RECTANGLE },
    { name: 'TrimBox', type: IntermediateObject.RECTANGLE },
    { name: 'ArtBox', type: IntermediateObject.RECTANGLE },
    { name: 'BoxColorInfo', type: BaseObjects.DICTIONARY },
    { name: 'Contents', type: [BaseObjects.ARRAY, BaseObjects.STREAM] },
    { name: 'Rotate', type: BaseObjects.INTEGER },
    { name: 'Group', type: BaseObjects.DICTIONARY },
    { name: 'Thumb', type: BaseObjects.STREAM },
    { name: 'B', type: BaseObjects.ARRAY },
    { name: 'Dur', type: BaseObjects.NUMERIC }, // TODO: Number - whatever this means
    { name: 'Trans', type: BaseObjects.DICTIONARY },
    { name: 'Annots', type: BaseObjects.ARRAY },
    { name: 'AA', type: BaseObjects.DICTIONARY },
    { name: 'Metadata', type: BaseObjects.STREAM },
    { name: 'PieceInfo', type: BaseObjects.DICTIONARY },
    { name: 'StructParents', type: BaseObjects.INTEGER },
    { name: 'ID', type: BaseObjects.STRING }, // TODO: ByteString
    { name: 'PZ', type: BaseObjects.NUMERIC }, // TODO: Number - whatever this means
    { name: 'SparationInfo', type: BaseObjects.DICTIONARY },
    { name: 'Tabs', type: BaseObjects.NAME },
    { name: 'TemplateInstantiated', type: BaseObjects.NAME },
    { name: 'PresSteps', type: BaseObjects.DICTIONARY },
    { name: 'UserUnit', type: BaseObjects.NUMERIC }, // TODO: Number - whatever this means
    { name: 'VP', type: BaseObjects.DICTIONARY },
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
    super(pdf, value, shouldBeIndirect);
  }
}

export default PageTree;
