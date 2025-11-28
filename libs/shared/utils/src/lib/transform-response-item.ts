export function util<T>(resItem: { data: T } | undefined): T {
  if (!resItem) {
    throw new Error("Data is undefined");
  }

  return resItem.data;
}
