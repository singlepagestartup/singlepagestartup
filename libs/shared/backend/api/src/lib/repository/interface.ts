import {
  IDumpResult,
  ISeedResult,
  type IConfiguration,
} from "../configuration";
import { type IFilter } from "../query-builder/filters";
import { FindServiceProps } from "../services/interfaces";

export interface ITransferable {
  dump: (props?: any) => Promise<IDumpResult>;
  seed: (props?: { seeds: ISeedResult[] }) => Promise<ISeedResult>;
}

interface IDefaultRepository extends ITransferable {
  /**
   * The model configuration the repository was built from. Exposed so the REST
   * boundary can read `repository.outputSchema` (issue #270) without a second
   * DI binding in every module controller.
   */
  configuration?: ReturnType<IConfiguration["getConfiguration"]>;
  find: (props?: FindServiceProps) => Promise<any[]>;
  count: (props?: FindServiceProps) => Promise<number>;
  findByField: (field: string, value: any) => Promise<any>;
  findFirstByField: (field: string, value: any) => Promise<any>;
  insert: (data: any) => Promise<any>;
  deleteFirstByField: (field: string, value: any) => Promise<any>;
  updateFirstByField: (field: string, value: any, data: any) => Promise<any>;
  consumeFirstByField: (
    field: string,
    value: any,
    data: any,
    predicate?: { and: IFilter[] },
  ) => Promise<any>;
}

export interface IRepository extends IDefaultRepository {}
