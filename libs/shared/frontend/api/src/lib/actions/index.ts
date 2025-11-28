import { action as findById } from "./find-by-id";
export type { IProps as IFindByIdProps } from "./find-by-id";
import { action as create } from "./create";
export type { IProps as ICreateProps } from "./create";
import { action as remove } from "./delete";
export type { IProps as IDeleteProps } from "./delete";
import { action as find } from "./find";
export type { IProps as IFindProps } from "./find";
import { action as update } from "./update";
export type { IProps as IUpdateProps } from "./update";
import { action as findOrCreate } from "./find-or-create";
export type { IProps as IFindOrCreateProps } from "./find-or-create";
import { action as bulkCreate } from "./bulk-create";
export type { IProps as IBulkCreateProps } from "./bulk-create";
import { action as bulkUpdate } from "./bulk-update";
export type { IProps as IBulkUpdateProps } from "./bulk-update";

export const actions = {
  findById,
  create,
  delete: remove,
  find,
  update,
  findOrCreate,
  bulkCreate,
  bulkUpdate,
};
