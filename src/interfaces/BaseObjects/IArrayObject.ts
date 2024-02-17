import { IBaseObject } from './IBaseObject';
import { BaseObject } from '../../objects/BasicObjects';

export interface IArrayObject extends IBaseObject {
  value: Array<BaseObject>;

  push(object: BaseObject): void;
  pop(): BaseObject | undefined;
  toString(): string;
}
