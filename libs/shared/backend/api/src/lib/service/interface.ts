import { StatusCode } from "hono/utils/http-status";
import { IDumpResult, ISeedResult } from "../configuration";
import { FindServiceProps } from "../services/interfaces";

export interface IService<DTO extends Record<string, unknown>> {
  find: (props?: FindServiceProps) => Promise<DTO[]>;
  findById: (props: { id: string }) => Promise<DTO | null>;
  create: (props: { data: DTO }) => Promise<DTO | null>;
  delete: (props: { id: string }) => Promise<DTO | null>;
  update: (props: { id: string; data: DTO }) => Promise<DTO | null>;
  dump: (props?: { dumps: IDumpResult[] }) => Promise<IDumpResult>;
  seed: (props?: { seeds: ISeedResult[] }) => Promise<ISeedResult>;
  findOrCreate: (props: {
    data: DTO;
  }) => Promise<{ entity: DTO; statusCode: StatusCode }>;
}
