export type TBookmark = {
  title: string;
  pageObjectId: number;
  children: Array<TBookmark>;
  objectId?: number;
};
