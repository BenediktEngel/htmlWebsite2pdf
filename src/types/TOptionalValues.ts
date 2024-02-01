import { BaseObjects, IntermediateObjects, PdfVersion } from 'enums';

export type TOptionalValues = {
  name: string;
  type: BaseObjects | IntermediateObjects | Array<BaseObjects | IntermediateObjects>;
  minVersion?: PdfVersion;
  inheritable?: boolean;
};

export default TOptionalValues;
