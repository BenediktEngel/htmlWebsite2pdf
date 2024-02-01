import { ObjectType } from 'enums';

export interface IBaseObject {
  objectId: number | undefined;
  generation: number | undefined;
  type: ObjectType;
  isFree: boolean;
  byteOffset: number | undefined;

  outputObject(value: string): string;
  getReference(): string | undefined;
  ouputCrossReferenceData(): string | undefined;
}
