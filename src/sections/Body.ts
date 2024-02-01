import { NameObject } from 'objects';

export interface IBody {
  root: NameObject; // TODO: Should be a other type
}

export class Body implements IBody {
  root: NameObject = new NameObject(); // TODO: Should be a other type
}
