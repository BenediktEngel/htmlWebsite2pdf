export interface ICrossReferenceSubSection {
  firstId: number;
  objectCount: number;
  // TODO: Ignored type for now, cause it will probably get changed anyways
  // entries: Array<ArrayObject | BooleanObject | DictionaryObject | NameObject | NullObject | NumericObject | StreamObject | StringObject>;

  outputSection(): string;
}
