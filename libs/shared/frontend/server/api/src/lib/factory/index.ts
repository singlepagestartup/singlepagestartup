import {
  actions,
  IFindByIdProps,
  IFindProps,
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
    | IUpdateProps["params"]
    | ICreateProps["params"]
    | IDeleteProps["params"]
    | IBulkCreateProps["params"]
    | IBulkUpdateProps["params"];
  options?:
    | IFindByIdProps["options"]
    | IFindProps["options"]
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
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    find: async (props?: Omit<IFindProps, "model" | "route" | "host">) => {
      return await actions.find<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    update: async (props: Omit<IUpdateProps, "model" | "route" | "host">) => {
      return await actions.update<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    create: async (props: Omit<ICreateProps, "model" | "route" | "host">) => {
      return await actions.create<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    findOrCreate: async (
      props: Omit<IFindOrCreateProps, "model" | "route" | "host">,
    ) => {
      return await actions.findOrCreate<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    delete: async (props: Omit<IDeleteProps, "model" | "route" | "host">) => {
      return await actions.delete<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    bulkCreate: async (
      props: Omit<IBulkCreateProps, "model" | "route" | "host">,
    ) => {
      return await actions.bulkCreate<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    bulkUpdate: async (
      props: Omit<IBulkUpdateProps, "model" | "route" | "host">,
    ) => {
      return await actions.bulkUpdate<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
  };

  return api;
}
