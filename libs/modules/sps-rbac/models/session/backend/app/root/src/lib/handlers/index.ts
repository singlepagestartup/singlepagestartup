import { handler as findHander } from "./find";
import { handler as initHander } from "./init";
import { handler as findByIdHander } from "./find-by-id";
import { handler as createHander } from "./create";
import { handler as updateHander } from "./update";
import { handler as deleteHander } from "./delete";

export const handlers = {
  init: initHander,
  find: findHander,
  findById: findByIdHander,
  create: createHander,
  update: updateHander,
  delete: deleteHander,
};
