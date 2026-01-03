import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import { Repository } from "../../repository";
import { api } from "@sps/rbac/models/action/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  async create(data: any) {
    const superResult = super.create(data);

    const expiredActions = await this.repository.find({
      params: {
        filters: {
          and: [
            {
              column: "expiresAt",
              method: "lt",
              value: new Date().toISOString(),
            },
          ],
        },
      },
    });

    for (const expiredAction of expiredActions) {
      if (RBAC_SECRET_KEY) {
        api
          .delete({
            id: expiredAction.id,
            options: {
              headers: {
                "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
              },
            },
          })
          .catch((error) => {
            //
          });
      }
    }

    return superResult;
  }
}
