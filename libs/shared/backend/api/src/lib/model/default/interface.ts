import { FindByIdServiceProps } from "../../services/interfaces";

export interface IModel {
  find: () => Promise<any>;
  findById: (props: FindByIdServiceProps) => Promise<any>;
  create: (props: any) => Promise<any>;
  update: (props: any) => Promise<any>;
  delete: (props: any) => Promise<any>;
  dump: () => Promise<any>;
  seed: () => Promise<any>;
}
