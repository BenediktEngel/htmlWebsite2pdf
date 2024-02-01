import { BaseObjects, IntermediateObjects, PdfVersion } from 'enums';

export type TRequiredValues = {
  name: string;
  type: BaseObjects | IntermediateObjects;
  minVersion?: PdfVersion;
  inheritable?: boolean;
};

export default TRequiredValues;
