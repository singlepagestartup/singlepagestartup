import { IDumpResult, ISeedResult } from "../configuration";
import { FindServiceProps } from "../services/interfaces";

export interface ITransferable {
  dump: (props?: any) => Promise<IDumpResult>;
  seed: (props?: { seeds: ISeedResult[] }) => Promise<ISeedResult>;
}

interface IDefaultRepository extends ITransferable {
  find: (props?: FindServiceProps) => Promise<any[]>;
  count: (props?: FindServiceProps) => Promise<number>;
  findByField: (field: string, value: any) => Promise<any>;
  findFirstByField: (field: string, value: any) => Promise<any>;
  insert: (data: any) => Promise<any>;
  deleteFirstByField: (field: string, value: any) => Promise<any>;
  updateFirstByField: (field: string, value: any, data: any) => Promise<any>;
}

export interface IRepository extends IDefaultRepository {}
