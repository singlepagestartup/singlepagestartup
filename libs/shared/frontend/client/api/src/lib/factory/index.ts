"use client";

import {
  query as findByIdQuery,
  IQueryProps as IFindByIdQueryProps,
} from "./queries/find-by-id";
import {
  query as findQuery,
  IQueryProps as IFindQueryProps,
} from "./queries/find";
import {
  mutation as createMutation,
  IMutationProps as ICreateMutationProps,
  IMutationFunctionProps as ICreateMutationFunctionProps,
} from "./mutations/create";
import {
  mutation as updateMutation,
  IMutationProps as IUpdateMutationProps,
  IMutationFunctionProps as IUpdateMutationFunctionProps,
} from "./mutations/update";
import {
  mutation as deleteMutation,
  IMutationProps as IDeleteMutationProps,
  IMutationFunctionProps as IDeleteMutationFunctionProps,
} from "./mutations/delete";
import {
  DefaultError,
  QueryClient,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { globalActionsStore, IAction } from "@sps/shared-frontend-client-store";
import { STALE_TIME } from "@sps/shared-utils";
import { createId } from "@paralleldrive/cuid2";
import QueryString from "qs";

export interface IFactoryProps<T> {
  route: string;
  host: string;
  queryClient: QueryClient;
  staleTime?: number;
  params?:
    | IFindByIdQueryProps<T>["params"]
    | IFindQueryProps<T>["params"]
    | IUpdateMutationProps<T>["params"]
    | ICreateMutationProps<T>["params"]
    | IDeleteMutationProps<T>["params"];
  options?:
    | IFindByIdQueryProps<T>["options"]
    | IFindQueryProps<T>["options"]
    | IUpdateMutationProps<T>["options"]
    | ICreateMutationProps<T>["options"]
    | IDeleteMutationProps<T>["options"];
}

type SetRequestId = (requestId: string) => void;

const activeSubscriptions = new Set<string>();

export function subscription(route: string, queryClient: QueryClient) {
  if (activeSubscriptions.has(route)) {
    return;
  }

  activeSubscriptions.add(route);

  const triggeredActions: IAction[] = [];
  const mountTime = Date.now();

  globalActionsStore.subscribe((state) => {
    const revalidationMessages =
      state.getActionsFromStoreByName("revalidation");

    const messages = revalidationMessages || [];
    for (const message of messages) {
      if (new Date(message.result["createdAt"]).getTime() > mountTime) {
        const isTriggered = triggeredActions.some(
          (triggeredAction) =>
            JSON.stringify(triggeredAction) === JSON.stringify(message),
        );

        if (!isTriggered) {
          triggeredActions.push(message);

          if (
            message.result?.["payload"] &&
            typeof message.result?.["payload"] === "string" &&
            (route.includes(message.result["payload"]) ||
              message.result["payload"].includes(route))
          ) {
            setTimeout(() => {
              queryClient.invalidateQueries({
                queryKey: [route],
              });
            }, 1000);
          }
        }
      }
    }
  });
}

export function factory<T>(factoryProps: IFactoryProps<T>) {
  const api = {
    findById: (props: {
      id: IFindByIdQueryProps<T>["id"];
      params?: IFindByIdQueryProps<T>["params"];
      options?: IFindByIdQueryProps<T>["options"];
      reactQueryOptions?: any;
    }) => {
      subscription(
        `${factoryProps.route}/${props.id}`,
        factoryProps.queryClient,
      );

      return useQuery<T | undefined>({
        queryKey: props.id
          ? [
              `${factoryProps.route}/${props.id}`,
              props?.params
                ? QueryString.stringify(props.params, {
                    encodeValuesOnly: true,
                  })
                : undefined,
            ]
          : [],
        queryFn: props.id
          ? findByIdQuery({
              ...factoryProps,
              cb: (data) => {
                addToGlobalStore({
                  name: factoryProps.route,
                  type: "query",
                  result: data,
                  props,
                });
              },
              ...props,
            })
          : undefined,
        enabled: props.id ? true : false,
        staleTime:
          factoryProps.staleTime !== undefined
            ? factoryProps.staleTime
            : STALE_TIME,
        ...props?.reactQueryOptions,
      });
    },
    find: (props?: {
      params?: IFindQueryProps<T>["params"];
      options?: IFindQueryProps<T>["options"];
      reactQueryOptions?: any;
    }) => {
      subscription(factoryProps.route, factoryProps.queryClient);
      return useQuery<T[] | undefined>({
        queryKey: [
          `${factoryProps.route}`,
          props?.params
            ? QueryString.stringify(props.params, {
                encodeValuesOnly: true,
              })
            : undefined,
        ],
        queryFn: findQuery({
          ...factoryProps,
          cb: (data) => {
            addToGlobalStore({
              name: factoryProps.route,
              type: "query",
              result: data,
              props,
            });
          },
          ...props,
        }),
        staleTime:
          factoryProps.staleTime !== undefined
            ? factoryProps.staleTime
            : STALE_TIME,
        ...props?.reactQueryOptions,
      });
    },
    create: (props?: {
      params?: ICreateMutationProps<T>["params"];
      options?: ICreateMutationProps<T>["options"];
      setRequestId?: SetRequestId;
      reactQueryOptions?: any;
    }) => {
      subscription(factoryProps.route, factoryProps.queryClient);

      return useMutation<T, DefaultError, ICreateMutationFunctionProps>({
        mutationKey: [`${factoryProps.route}`],
        mutationFn: (mutationFunctionProps: ICreateMutationFunctionProps) => {
          return createMutation<T>({
            ...factoryProps,
            cb: (data) => {
              addToGlobalStore({
                name: factoryProps.route,
                type: "mutation",
                result: data,
                props,
                setRequestId: props?.setRequestId,
              });
            },
            ...props,
          })(mutationFunctionProps);
        },
        ...props?.reactQueryOptions,
      });
    },
    update: (props?: {
      id: IUpdateMutationProps<T>["id"];
      params?: IUpdateMutationProps<T>["params"];
      options?: IUpdateMutationProps<T>["options"];
      setRequestId?: SetRequestId;
      reactQueryOptions?: any;
    }) => {
      subscription(`${factoryProps.route}`, factoryProps.queryClient);

      return useMutation<T, DefaultError, IUpdateMutationFunctionProps>({
        mutationKey: props?.id
          ? [`${factoryProps.route}/${props.id}`]
          : [`${factoryProps.route}`],
        mutationFn: (mutationFunctionProps: IUpdateMutationFunctionProps) => {
          return updateMutation<T>({
            ...factoryProps,
            cb: (data) => {
              addToGlobalStore({
                name: factoryProps.route,
                type: "mutation",
                result: data,
                props,
                setRequestId: props?.setRequestId,
              });
            },
            ...props,
          })(mutationFunctionProps);
        },
        ...props?.reactQueryOptions,
      });
    },
    delete: (props?: {
      id?: IDeleteMutationProps<T>["id"];
      params?: IDeleteMutationProps<T>["params"];
      options?: IDeleteMutationProps<T>["options"];
      reactQueryOptions?: any;
    }) => {
      subscription(factoryProps.route, factoryProps.queryClient);

      return useMutation<T, DefaultError, IDeleteMutationFunctionProps>({
        mutationKey: props?.id
          ? [`${factoryProps.route}/${props.id}`]
          : [`${factoryProps.route}`],
        mutationFn: (mutationFunctionProps: IDeleteMutationFunctionProps) => {
          return deleteMutation<T>({
            ...factoryProps,
            cb: (data) => {
              addToGlobalStore({
                name: factoryProps.route,
                type: "mutation",
                result: data,
                props,
              });
            },
            ...props,
          })(mutationFunctionProps);
        },
        ...props?.reactQueryOptions,
      });
    },
  };

  return api;
}

function addToGlobalStore(props: {
  name: string;
  type: string;
  props: any;
  result: any;
  setRequestId?: SetRequestId;
}) {
  const requestId = createId();

  const state = globalActionsStore.getState();

  if (props.setRequestId) {
    props.setRequestId(requestId);
  }

  state.addAction({
    type: props.type,
    name: props.name,
    props: props.props,
    result: props.result,
    timestamp: Date.now(),
    requestId,
  });
}
