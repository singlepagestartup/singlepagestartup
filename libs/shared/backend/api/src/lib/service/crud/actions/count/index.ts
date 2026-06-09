import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI } from "../../../../di/constants";
import { type IRepository } from "../../../../repository";
import { FindServiceProps } from "../../../../services/interfaces";

@injectable()
export class Action {
  repository: IRepository;

  constructor(@inject(DI.IRepository) repository: IRepository) {
    this.repository = repository;
  }

  async execute(props?: FindServiceProps) {
    const result = await this.repository.count(props);

    return result;
  }
}
