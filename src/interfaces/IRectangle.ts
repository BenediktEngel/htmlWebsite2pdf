import { IArrayObject } from 'interfaces';
import { IntegerObject } from 'objects';

export interface IRectangle extends IArrayObject {
  value: Array<IntegerObject>;
}

export default IRectangle;
