import {
  actions,
  IFindByIdActionProps,
  IFindActionProps,
  IUpdateActionProps,
  ICreateActionProps,
  IDeleteActionProps,
  IFindOrCreateActionProps,
} from "@sps/shared-frontend-api";

export interface IFactoryProps {
  route: string;
  host: string;
  params?:
    | IFindByIdActionProps["params"]
    | IFindActionProps["params"]
    | IUpdateActionProps["params"]
    | ICreateActionProps["params"]
    | IDeleteActionProps["params"];
  options?:
    | IFindByIdActionProps["options"]
    | IFindActionProps["options"]
    | IUpdateActionProps["options"]
    | ICreateActionProps["options"]
    | IDeleteActionProps["options"];
}

export function factory<T>(params: IFactoryProps) {
  const api = {
    findById: async (
      props: Omit<IFindByIdActionProps, "model" | "route" | "host">,
    ) => {
      return await actions.findById<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    find: async (
      props?: Omit<IFindActionProps, "model" | "route" | "host">,
    ) => {
      return await actions.find<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    update: async (
      props: Omit<IUpdateActionProps, "model" | "route" | "host">,
    ) => {
      return await actions.update<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    create: async (
      props: Omit<ICreateActionProps, "model" | "route" | "host">,
    ) => {
      return await actions.create<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    findOrCreate: async (
      props: Omit<IFindOrCreateActionProps, "model" | "route" | "host">,
    ) => {
      return await actions.findOrCreate<T>({
        params: params.params,
        options: params.options,
        route: params.route,
        host: params.host,
        ...props,
      });
    },
    delete: async (
      props: Omit<IDeleteActionProps, "model" | "route" | "host">,
    ) => {
      return await actions.delete<T>({
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
