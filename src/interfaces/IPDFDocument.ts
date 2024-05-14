import { PdfVersion } from '../enums';
import { IDictionaryObject } from './BaseObjects/IDictionaryObject';
import { ICrossReferenceTable } from './ICrossReferenceTable';
import { IDocumentStructureDictionary } from './IDocumentStructureDictionary';
import { IIndirectObject } from './IIndirectObject';

export interface IPDFDocument {
  version: PdfVersion;
  title: string;
  subject: string;
  keywords: string;
  author: string;
  crossReferenceTable: ICrossReferenceTable;
  catalog: IDocumentStructureDictionary | undefined;
  pageTree: IDocumentStructureDictionary | undefined;
  trailer: IDictionaryObject;
  indirectObjects: Map<number, IIndirectObject>;
}
