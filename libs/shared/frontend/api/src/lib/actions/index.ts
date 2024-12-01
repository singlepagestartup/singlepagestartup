import { action as findById } from "./find-by-id";
export type { IActionProps as IFindByIdActionProps } from "./find-by-id";
import { action as create } from "./create";
export type { IActionProps as ICreateActionProps } from "./create";
import { action as remove } from "./delete";
export type { IActionProps as IDeleteActionProps } from "./delete";
import { action as find } from "./find";
export type { IActionProps as IFindActionProps } from "./find";
import { action as update } from "./update";
export type { IActionProps as IUpdateActionProps } from "./update";
import { action as findOrCreate } from "./find-or-create";
export type { IActionProps as IFindOrCreateActionProps } from "./find-or-create";

export const actions = {
  findById,
  create,
  delete: remove,
  find,
  update,
  findOrCreate,
};
