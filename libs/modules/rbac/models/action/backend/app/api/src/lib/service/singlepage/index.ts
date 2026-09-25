import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  CRUDService,
  DI,
  type IQueryBuilderFilter,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import { Repository } from "../../repository";

export type IConsumeProps = {
  id: string;
  data: any;
  filters?: {
    and: IQueryBuilderFilter[];
  };
};

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  /**
   * Claims an action row in one write. Callers that must not act twice on the
   * same row - an OAuth state, an exchange code - pass the "not consumed yet"
   * predicate here instead of reading the row and writing it back.
   */
  async consume(props: IConsumeProps) {
    return this.repository.consumeFirstByField(
      "id",
      props.id,
      props.data,
      props.filters,
    );
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
