import { BaseObjects, IntermediateObject, PdfVersion } from '../enums';

export type TRequiredValue = {
  name: string;
  type: BaseObjects | IntermediateObject;
  minVersion?: PdfVersion;
  inheritable?: boolean;
  exception?(): boolean;
};

export default TRequiredValue;
