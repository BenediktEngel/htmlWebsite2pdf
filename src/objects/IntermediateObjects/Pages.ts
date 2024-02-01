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

export class Pages extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  readonly requieredValues: Array<{ name: string; type: BaseObjects | IntermediateObjects }> = [
    { name: 'Type', type: BaseObjects.NAME },
    { name: 'Kids', type: BaseObjects.ARRAY },
    { name: 'Count', type: BaseObjects.NUMERIC },
  ];

  readonly optionalValues: Array<{ name: string; type: BaseObjects | IntermediateObjects | Array<BaseObjects | IntermediateObjects> }> = [
    { name: 'Parent', type: BaseObjects.DICTIONARY }, // TODO: This is not allowed for the root node for each other node it is required
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

  fixedValues: Map<
    NameObject,
    DictionaryObject | NameObject | NullObject | ArrayObject | BooleanObject | NumericObject | StreamObject | StringObject
  > = new Map([[new NameObject('Type'), new NameObject('Pages')]]);

  constructor(
    value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    super(value, type, id, generation);
  }
}

export default Pages;
