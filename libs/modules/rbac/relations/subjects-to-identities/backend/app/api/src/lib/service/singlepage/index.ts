import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/relations/subjects-to-identities/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {}
