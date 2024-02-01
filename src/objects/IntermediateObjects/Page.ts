import { BaseObjects, IntermediateObjects, ObjectType } from 'enums';
import { IDocumentStructureDictionary } from 'interfaces';
import {
  ArrayObject,
  BooleanObject,
  DictionaryObject,
  DocumentStructureDictionary,
  NameObject,
  NullObject,
  NumericObject,
  StreamObject,
  StringObject,
} from 'objects';
import { TRequiredValues, TOptionalValues } from 'types';

export class Page extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  readonly requieredValues: Array<TRequiredValues> = [
    { name: 'Type', type: BaseObjects.NAME },
    { name: 'Count', type: BaseObjects.NUMERIC },
    { name: 'Parent', type: BaseObjects.DICTIONARY },
  ];

  readonly optionalValues: Array<TOptionalValues> = [
    { name: 'LastModified', type: BaseObjects.STRING }, // TODO: Date
    { name: 'Resources', type: BaseObjects.DICTIONARY },
    { name: 'MediaBox', type: IntermediateObjects.RECTANGLE },
    { name: 'CropBox', type: IntermediateObjects.RECTANGLE },
    { name: 'BleedBox', type: IntermediateObjects.RECTANGLE },
    { name: 'TrimBox', type: IntermediateObjects.RECTANGLE },
    { name: 'ArtBox', type: IntermediateObjects.RECTANGLE },
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

  readonly fixedValues: Map<
    NameObject,
    NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject
  > = new Map([[new NameObject('Type'), new NameObject('Page')]]);

  constructor(
    value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    super(value, type, id, generation);
  }
}

export default Page;
