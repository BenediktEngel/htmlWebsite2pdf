import { BaseObjects, IntermediateObject, PdfVersion } from 'enums';

export type TOptionalValue = {
  name: string;
  type: BaseObjects | IntermediateObject | Array<BaseObjects | IntermediateObject>;
  minVersion?: PdfVersion;
  inheritable?: boolean;
};

export default TOptionalValue;
