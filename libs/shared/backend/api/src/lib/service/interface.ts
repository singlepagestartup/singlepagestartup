import { ContentfulStatusCode } from "hono/utils/http-status";
import { IDumpResult, ISeedResult } from "../configuration";
import { type IRepository } from "../repository/interface";
import { FindServiceProps } from "../services/interfaces";

export interface IService<DTO extends Record<string, unknown>> {
  /**
   * Optional so that a hand-written service still satisfies the interface; the
   * REST boundary reads the model configuration through it (issue #270).
   */
  repository?: IRepository;
  find: (props?: FindServiceProps) => Promise<DTO[]>;
  count: (props?: FindServiceProps) => Promise<number>;
  findById: (props: { id: string }) => Promise<DTO | null>;
  create: (props: { data: DTO }) => Promise<DTO | null>;
  delete: (props: { id: string }) => Promise<DTO | null>;
  update: (props: { id: string; data: DTO }) => Promise<DTO | null>;
  dump: (props?: { dumps: IDumpResult[] }) => Promise<IDumpResult>;
  seed: (props?: { seeds: ISeedResult[] }) => Promise<ISeedResult>;
  findOrCreate: (props: {
    data: DTO;
  }) => Promise<{ entity: DTO; statusCode: ContentfulStatusCode }>;
}
