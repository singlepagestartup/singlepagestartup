import "reflect-metadata";
import { inject, injectable } from "inversify";
import { type IRepository } from "../../../../repository";
import { DI } from "../../../../di/constants";

@injectable()
export class Action<SCHEMA extends Record<string, unknown>> {
  repository: IRepository;

  constructor(@inject(DI.IRepository) repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: { id: string; data: any }) {
    delete props.data.updatedAt;

    const result = await this.repository.updateFirstByField(
      "id",
      props.id,
      props.data,
    );

    return result;
  }
}
