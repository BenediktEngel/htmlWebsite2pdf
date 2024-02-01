import { BaseObjects, ObjectType, PdfVersion, IntermediateObjects } from 'enums';
import { IDocumentStructureDictionary } from 'interfaces';
import {
  DictionaryObject,
  NameObject,
  ArrayObject,
  BooleanObject,
  NullObject,
  NumericObject,
  StreamObject,
  StringObject,
  DocumentStructureDictionary,
} from 'objects';
import { TRequiredValues, TOptionalValues } from 'types';

export class CatalagDictionary extends DocumentStructureDictionary implements IDocumentStructureDictionary {
  readonly requieredValues: Array<TRequiredValues> = [
    { name: 'Type', type: BaseObjects.NAME },
    { name: 'Pages', type: IntermediateObjects.PAGES },
  ];

  readonly optionalValues: Array<TOptionalValues> = [
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

  readonly fixedValues: Map<
    NameObject,
    NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject
  > = new Map([[new NameObject('Type'), new NameObject('Catalog')]]);

  constructor(
    value: Map<NameObject, NullObject | NameObject | ArrayObject | BooleanObject | DictionaryObject | NumericObject | StreamObject | StringObject>,
    type: ObjectType = ObjectType.DIRECT,
    id?: number,
    generation?: number,
  ) {
    super(value, type, id, generation);
    // TODO: remove this part cause we want to check later if the requiered values are set
    this.requieredValues.forEach((requiredValue) => {
      switch (requiredValue.type) {
        case BaseObjects.NAME:
          this.value.set(new NameObject(requiredValue.name), new NameObject(''));
          break;
        case BaseObjects.DICTIONARY:
          this.value.set(new NameObject(requiredValue.name), new DictionaryObject(new Map()));
          break;
        default:
          break;
      }
    });
  }
}

export default CatalagDictionary;
