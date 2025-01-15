import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI, FindServiceProps } from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/action/backend/repository/database";
import { FindAction } from "../actions";
import { Repository } from "../repository";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
    this.repository = repository;
  }

  async find(
    props?: FindServiceProps,
  ): Promise<(typeof Table)["$inferSelect"][]> {
    const action = new FindAction(this.repository);
    return action.execute(props);
  }
}
