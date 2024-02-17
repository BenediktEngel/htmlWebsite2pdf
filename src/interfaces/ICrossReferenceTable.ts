import type { ICrossReferenceSection } from './ICrossReferenceSection';
import type { INumericObject } from './BaseObjects/INumericObject';

export interface ICrossReferenceTable {
  size: INumericObject;
  sections: Array<ICrossReferenceSection>;
}
