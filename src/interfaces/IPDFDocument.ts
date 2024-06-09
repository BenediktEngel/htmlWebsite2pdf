import { PdfVersion } from '../enums';
import { IDictionaryObject } from './BaseObjects/IDictionaryObject';
import { ICrossReferenceSection } from './ICrossReferenceSection';
import { IIndirectObject } from './IIndirectObject';

export interface IPDFDocument {
  version: PdfVersion;
  title: string;
  subject: string;
  keywords: string;
  author: string;
  crossReferenceTable: ICrossReferenceSection;
  catalog: IDictionaryObject | undefined;
  pageTree: IDictionaryObject | undefined;
  trailer: IDictionaryObject;
  indirectObjects: Map<number, IIndirectObject>;
}
