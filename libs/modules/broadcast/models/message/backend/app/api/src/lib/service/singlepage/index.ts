import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Table } from "@sps/broadcast/models/message/backend/repository/database";
import { Repository } from "../../repository";

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

    Promise.allSettled(
      expiredActions.map((action) =>
        this.delete({ id: action.id }).catch((error) => {
          //
        }),
      ),
    );

    return superResult;
  }
}
