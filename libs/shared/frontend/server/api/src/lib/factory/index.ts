import {
  actions,
  IFindByIdProps,
  IFindProps,
  ICountProps,
  IUpdateProps,
  ICreateProps,
  IDeleteProps,
  IFindOrCreateProps,
  IBulkCreateProps,
  IBulkUpdateProps,
} from "@sps/shared-frontend-api";

export interface IFactoryProps {
  route: string;
  host: string;
  params?:
    | IFindByIdProps["params"]
    | IFindProps["params"]
    | ICountProps["params"]
    | IUpdateProps["params"]
    | ICreateProps["params"]
    | IDeleteProps["params"]
    | IBulkCreateProps["params"]
    | IBulkUpdateProps["params"];
  options?:
    | IFindByIdProps["options"]
    | IFindProps["options"]
    | ICountProps["options"]
    | IUpdateProps["options"]
    | ICreateProps["options"]
    | IDeleteProps["options"]
    | IBulkCreateProps["options"]
    | IBulkUpdateProps["options"];
}

export function factory<T>(params: IFactoryProps) {
  const api = {
    findById: async (
      props: Omit<IFindByIdProps, "model" | "route" | "host">,
    ) => {
      return await actions.findById<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    find: async (props?: Omit<IFindProps, "model" | "route" | "host">) => {
      return await actions.find<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    count: async (props?: Omit<ICountProps, "model" | "route" | "host">) => {
      return await actions.count({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    update: async (props: Omit<IUpdateProps, "model" | "route" | "host">) => {
      return await actions.update<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    create: async (props: Omit<ICreateProps, "model" | "route" | "host">) => {
      return await actions.create<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    findOrCreate: async (
      props: Omit<IFindOrCreateProps, "model" | "route" | "host">,
    ) => {
      return await actions.findOrCreate<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    delete: async (props: Omit<IDeleteProps, "model" | "route" | "host">) => {
      return await actions.delete<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    bulkCreate: async (
      props: Omit<IBulkCreateProps, "model" | "route" | "host">,
    ) => {
      return await actions.bulkCreate<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
    bulkUpdate: async (
      props: Omit<IBulkUpdateProps, "model" | "route" | "host">,
    ) => {
      return await actions.bulkUpdate<T>({
        params: params.params,
        options: params.options,
        ...props,
        route: params.route,
        host: params.host,
      });
    },
  };

  return api;
}
