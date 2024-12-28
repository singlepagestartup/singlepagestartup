import "reflect-metadata";
import { inject, injectable } from "inversify";
import { type IRepository } from "../../../../repository";
import { DI } from "../../../../di/constants";
import { QueryBuilderFilterMethods } from "../../../../configuration";
import { ContentfulStatusCode } from "hono/utils/http-status";

@injectable()
export class Action<SCHEMA extends Record<string, unknown>> {
  repository: IRepository;

  constructor(@inject(DI.IRepository) repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: { data: SCHEMA }) {
    const { data } = props;

    const filters = Object.entries(props.data).map(([key, value]) => ({
      column: key,
      method: "eq" as unknown as keyof QueryBuilderFilterMethods,
      value: value as string | Date | number | boolean | [number, number],
    }));

    const findResult = await this.repository.find({
      params: {
        filters: {
          and: filters,
        },
      },
    });

    if (findResult?.length) {
      return { entity: findResult[0], statusCode: 200 as ContentfulStatusCode };
    }

    const result = await this.repository.insert(data);

    return { entity: result, statusCode: 201 as ContentfulStatusCode };
  }
}
