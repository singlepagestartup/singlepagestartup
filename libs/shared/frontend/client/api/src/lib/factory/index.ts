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
import { useEffect } from "react";

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

const activeSubscriptions = new Map<string, number>();
const unsubscribeFunctions = new Map<string, () => void>();
const MAX_ACTIONS = 10;

export function subscription(route: string, queryClient: QueryClient) {
  const currentCount = activeSubscriptions.get(route) || 0;

  // Increment subscription counter
  activeSubscriptions.set(route, currentCount + 1);

  // If this is the first subscription to this route, create listener
  if (currentCount === 0) {
    let triggeredActions: IAction[] = [];
    const mountTime = Date.now();

    const unsubscribe = globalActionsStore.subscribe((state) => {
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
            triggeredActions = [...triggeredActions.slice(-MAX_ACTIONS)];
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

    unsubscribeFunctions.set(route, unsubscribe);
  }

  // Return unsubscribe function
  return () => {
    const count = activeSubscriptions.get(route) || 0;

    if (count <= 1) {
      // Last subscription - remove everything
      activeSubscriptions.delete(route);
      const unsubscribe = unsubscribeFunctions.get(route);
      if (unsubscribe) {
        unsubscribe();
        unsubscribeFunctions.delete(route);
      }
    } else {
      // Decrement counter
      activeSubscriptions.set(route, count - 1);
    }
  };
}

export function factory<T>(factoryProps: IFactoryProps<T>) {
  const api = {
    findById: (props: {
      id: IFindByIdQueryProps<T>["id"];
      params?: IFindByIdQueryProps<T>["params"];
      options?: IFindByIdQueryProps<T>["options"];
      reactQueryOptions?: any;
    }) => {
      const route = `${factoryProps.route}/${props.id}`;

      useEffect(() => {
        if (props.id) {
          const unsubscribe = subscription(route, factoryProps.queryClient);
          return unsubscribe;
        }
      }, [props.id, route]);

      return useQuery<T | undefined>({
        queryKey: props.id
          ? [
              route,
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
      useEffect(() => {
        const unsubscribe = subscription(
          factoryProps.route,
          factoryProps.queryClient,
        );
        return unsubscribe;
      }, []);

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
      useEffect(() => {
        const unsubscribe = subscription(
          factoryProps.route,
          factoryProps.queryClient,
        );
        return unsubscribe;
      }, []);

      return useMutation<T, DefaultError, ICreateMutationFunctionProps>({
        mutationKey: [`${factoryProps.route}`],
        mutationFn: (mutationFunctionProps: ICreateMutationFunctionProps) => {
          return createMutation<T>({
            ...factoryProps,
            cb: (data) => {
              addToGlobalStore({
                name: factoryProps.route,
                type: "mutation",
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
      useEffect(() => {
        const unsubscribe = subscription(
          factoryProps.route,
          factoryProps.queryClient,
        );
        return unsubscribe;
      }, []);

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
      useEffect(() => {
        const unsubscribe = subscription(
          factoryProps.route,
          factoryProps.queryClient,
        );
        return unsubscribe;
      }, []);

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
    timestamp: Date.now(),
    requestId,
  });
}
