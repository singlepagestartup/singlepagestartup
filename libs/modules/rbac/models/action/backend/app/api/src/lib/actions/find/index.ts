import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, FindServiceProps } from "@sps/shared-backend-api";
import { Repository } from "../../repository";

@injectable()
export class Action {
  repository: Repository;

  constructor(@inject(DI.IRepository) repository: Repository) {
    this.repository = repository;
  }

  async execute(props?: FindServiceProps) {
    const result = await this.repository.find(props);

    return result;
  }
}
