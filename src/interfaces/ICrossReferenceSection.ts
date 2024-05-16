import type { ICrossReferenceSubSection } from './ICrossReferenceSubSection';
import type { INumericObject } from './BaseObjects/INumericObject';

export interface ICrossReferenceSection {
  size: INumericObject;
  sections: Array<ICrossReferenceSubSection>;
}
