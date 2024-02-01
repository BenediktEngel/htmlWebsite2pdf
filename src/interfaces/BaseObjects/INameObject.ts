import { IBaseObject } from 'interfaces';

export interface INameObject extends IBaseObject {
  value: string;

  outputObject(): string;
}
