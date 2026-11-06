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
    if (
      Object.hasOwn(props.data, "metadata") &&
      Object.hasOwn(props.data, "_expectedMetadata")
    ) {
      const expectedMetadata = props.data._expectedMetadata;
      delete props.data._expectedMetadata;
      const result = await this.repository.consumeFirstByField(
        "id",
        props.id,
        props.data,
        {
          and: [{ column: "metadata", method: "eq", value: expectedMetadata }],
        },
      );
      if (!result)
        throw new Error(
          "Conflict error. Metadata changed. Reload the record before saving again.",
        );
      return result;
    }

    const result = await this.repository.updateFirstByField(
      "id",
      props.id,
      props.data,
    );

    return result;
  }
}
