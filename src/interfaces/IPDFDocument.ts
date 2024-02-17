import { PdfVersion } from '../enums';
import { IDictionaryObject } from './BaseObjects/IDictionaryObject';
import { ICrossReferenceTable } from './ICrossReferenceTable';
import { IDocumentStructureDictionary } from './IDocumentStructureDictionary';
import { IIndirectObject } from './IIndirectObject';

export interface IPDFDocument {
  version: PdfVersion;
  crossReferenceTable: ICrossReferenceTable;
  catalog: IDocumentStructureDictionary | undefined;
  root: IDocumentStructureDictionary | undefined;
  trailer: IDictionaryObject;
  indirectObjects: Map<number, IIndirectObject>;
}
