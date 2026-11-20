import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import type { IModel } from "@sps/rbac/relations/subjects-to-provider-identities/sdk/model";

@injectable()
@injectFromBase()
export class Service extends CRUDService<IModel> {}
