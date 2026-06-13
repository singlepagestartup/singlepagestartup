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
  query as countQuery,
  IQueryProps as ICountQueryProps,
} from "./queries/count";
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
import { deriveTopicsFromPath, STALE_TIME } from "@sps/shared-utils";
import { createId } from "@paralleldrive/cuid2";
import QueryString from "qs";
import { useEffect } from "react";
import {
  appendToListQueries,
  patchInListQueries,
  removeFromListQueries,
} from "../cache";

export interface IFactoryProps<T> {
  route: string;
  host: string;
  queryClient: QueryClient;
  staleTime?: number;
  params?:
    | IFindByIdQueryProps<T>["params"]
    | IFindQueryProps<T>["params"]
    | ICountQueryProps["params"]
    | IUpdateMutationProps<T>["params"]
    | ICreateMutationProps<T>["params"]
    | IDeleteMutationProps<T>["params"];
  options?:
    | IFindByIdQueryProps<T>["options"]
    | IFindQueryProps<T>["options"]
    | ICountQueryProps["options"]
    | IUpdateMutationProps<T>["options"]
    | ICreateMutationProps<T>["options"]
    | IDeleteMutationProps<T>["options"];
}

type SetRequestId = (requestId: string) => void;

const activeSubscriptions = new Map<string, number>();
const unsubscribeFunctions = new Map<string, () => void>();
const MAX_ACTIONS = 10;

// PER-CLIENT topic-invalidation dedup (issue #195). Every subscribed route owns
// its own store listener, and `invalidateByTopics` is a global, predicate-based
// operation — if each listener deduplicated only against its own history, one
// broadcast would schedule one global invalidation PER SUBSCRIBED ROUTE
// (dozens on a chat page), producing a refetch storm of identical requests
// spread across the jitter window. So the dedup must be shared across every
// listener of the SAME QueryClient (the first listener wins; the rest skip).
//
// It must NOT be shared across DIFFERENT QueryClients: SSR isolates one client
// per request and in-band tests create many clients, so a single module-global
// buffer would let one client's dedup suppress another client's invalidation.
// A WeakMap keyed by QueryClient gives each client its own dedup set that is
// garbage-collected with the client. Keys embed the broadcast `createdAt`, so
// the set is naturally bounded by the store's revalidation buffer — no eviction
// cap is needed (an unbounded eviction cap previously re-fired invalidation for
// keys evicted under a burst of distinct broadcasts).
const triggeredTopicKeysByClient = new WeakMap<QueryClient, Set<string>>();

const getTriggeredTopicKeys = (queryClient: QueryClient): Set<string> => {
  let keys = triggeredTopicKeysByClient.get(queryClient);
  if (!keys) {
    keys = new Set<string>();
    triggeredTopicKeysByClient.set(queryClient, keys);
  }
  return keys;
};

const normalizePath = (value: string) => value.split("?")[0];
const isSegmentPrefix = (fullPath: string, candidatePrefix: string) => {
  if (!fullPath.startsWith(candidatePrefix)) {
    return false;
  }

  if (fullPath.length === candidatePrefix.length) {
    return true;
  }

  const nextChar = fullPath[candidatePrefix.length];
  return nextChar === "/";
};

const isMatchingRoute = (route: string, payload: string) => {
  const normalizedRoute = normalizePath(route);
  const normalizedPayload = normalizePath(payload);

  return (
    isSegmentPrefix(normalizedRoute, normalizedPayload) ||
    isSegmentPrefix(normalizedPayload, normalizedRoute)
  );
};

const invalidateByTopics = (topics: string[], queryClient: QueryClient) => {
  if (!topics.length) {
    return;
  }

  queryClient.invalidateQueries({
    predicate: (query) => {
      const meta = query.meta as { topics?: string[] } | undefined;
      const metaTopics = Array.isArray(meta?.topics) ? meta.topics : [];

      return topics.some((topic) => metaTopics.includes(topic));
    },
  });
};

const hasTopicQueries = (topics: string[], queryClient: QueryClient) => {
  if (!topics.length) {
    return false;
  }

  const queries = queryClient.getQueryCache().findAll({
    predicate: (query) => {
      const meta = query.meta as { topics?: string[] } | undefined;
      const metaTopics = Array.isArray(meta?.topics) ? meta.topics : [];

      return topics.some((topic) => metaTopics.includes(topic));
    },
  });

  return queries.length > 0;
};

// Whether THIS route's own queries are covered by a topic invalidation.
// A query is covered when its key's first element equals `route` AND its
// `meta.topics` intersect the broadcast `topics`. Used to decide whether the
// per-route fallback can be safely skipped: a global topic invalidation only
// covers this route when the route has at least one such matching query.
// Without this check, a route subscribed via `subscription(route)` but whose
// own query lacks matching `meta.topics` would lose ALL invalidation whenever
// any unrelated query on the page happened to match the topics.
const routeHasMatchingTopicQuery = (
  route: string,
  topics: string[],
  queryClient: QueryClient,
) => {
  if (!topics.length) {
    return false;
  }

  const queries = queryClient.getQueryCache().findAll({
    predicate: (query) => {
      const firstKey = query.queryKey?.[0];
      if (firstKey !== route) {
        return false;
      }

      const meta = query.meta as { topics?: string[] } | undefined;
      const metaTopics = Array.isArray(meta?.topics) ? meta.topics : [];

      return topics.some((topic) => metaTopics.includes(topic));
    },
  });

  return queries.length > 0;
};

const getTopicTriggerKey = (createdAt: string, topics: string[]) => {
  return `${createdAt}:${topics.slice().sort().join("|")}`;
};

// Cross-client reconciliation is immediate (issue #195): invalidation runs as
// soon as a revalidation broadcast arrives. A small randomized jitter spreads
// the refetch load when many clients receive the same broadcast - it must stay
// well below human-perceptible latency.
const INVALIDATION_JITTER_MAX_MS = 200;

const getInvalidationJitterMs = () => {
  return Math.floor(Math.random() * INVALIDATION_JITTER_MAX_MS);
};

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
        // Guard against result-less revalidation messages: an undefined
        // `result` would throw inside this Zustand subscriber and kill realtime
        // invalidation for the whole route. Fall back to epoch (< mountTime) so
        // such a message is simply skipped instead of crashing the listener.
        if (
          new Date(message.result?.["createdAt"] ?? 0).getTime() > mountTime
        ) {
          const topics = Array.isArray(message.result?.["topics"])
            ? message.result["topics"].filter(
                (topic: unknown): topic is string =>
                  typeof topic === "string" && topic.length > 0,
              )
            : [];

          if (topics.length) {
            const topicTriggerKey = getTopicTriggerKey(
              String(message.result?.["createdAt"] || ""),
              topics,
            );
            const hasTopicsToInvalidate = hasTopicQueries(topics, queryClient);

            const triggeredTopicKeys = getTriggeredTopicKeys(queryClient);
            const isTopicTriggered = triggeredTopicKeys.has(topicTriggerKey);

            if (hasTopicsToInvalidate && !isTopicTriggered) {
              triggeredTopicKeys.add(topicTriggerKey);

              setTimeout(() => {
                invalidateByTopics(topics, queryClient);
              }, getInvalidationJitterMs());
            }

            // Only skip the per-route fallback when THIS route's own queries are
            // actually covered by the topic invalidation. If they are not, fall
            // through so the route fallback (payload match -> invalidate
            // [route]) still updates this listener's query.
            if (routeHasMatchingTopicQuery(route, topics, queryClient)) {
              continue;
            }
          }

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
              isMatchingRoute(route, message.result["payload"])
            ) {
              setTimeout(() => {
                queryClient.invalidateQueries({
                  queryKey: [route],
                });
              }, getInvalidationJitterMs());
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

        return;
      }, [props.id, route]);

      // Destructure `meta` out of reactQueryOptions so the trailing spread does
      // NOT re-introduce it and silently clobber the derived topics. A
      // project-supplied meta is MERGED on top of the derived topics instead.
      const { meta: userMeta, ...restReactQueryOptions } =
        props?.reactQueryOptions ?? {};

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
        // Canonical realtime subscription (issue #195): derived from the same
        // algorithm the backend emitter and http-cache use, so every factory
        // detail query is topic-invalidated when its entity changes. Topics
        // survive even when a project passes reactQueryOptions.meta.
        meta: props.id
          ? { topics: deriveTopicsFromPath(route), ...(userMeta ?? {}) }
          : undefined,
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
        ...restReactQueryOptions,
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

      // Destructure `meta` out of reactQueryOptions so the trailing spread does
      // NOT re-introduce it and silently clobber the derived topics. A
      // project-supplied meta is MERGED on top of the derived topics instead.
      const { meta: userMeta, ...restReactQueryOptions } =
        props?.reactQueryOptions ?? {};

      return useQuery<T[] | undefined>({
        queryKey: [
          `${factoryProps.route}`,
          props?.params
            ? QueryString.stringify(props.params, {
                encodeValuesOnly: true,
              })
            : undefined,
        ],
        // Canonical realtime subscription (issue #195): every factory list
        // query is topic-invalidated when its collection changes anywhere.
        // Topics survive even when a project passes reactQueryOptions.meta.
        meta: {
          topics: deriveTopicsFromPath(factoryProps.route),
          ...(userMeta ?? {}),
        },
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
        ...restReactQueryOptions,
      });
    },
    count: (props?: {
      params?: ICountQueryProps["params"];
      options?: ICountQueryProps["options"];
      reactQueryOptions?: any;
    }) => {
      const route = `${factoryProps.route}/count`;

      useEffect(() => {
        const unsubscribe = subscription(route, factoryProps.queryClient);

        return unsubscribe;
      }, [route]);

      // Destructure `meta` out of reactQueryOptions so the trailing spread does
      // NOT re-introduce it and silently clobber the derived topics. A
      // project-supplied meta is MERGED on top of the derived topics instead.
      const { meta: userMeta, ...restReactQueryOptions } =
        props?.reactQueryOptions ?? {};

      return useQuery<number | undefined>({
        queryKey: [
          route,
          props?.params
            ? QueryString.stringify(props.params, {
                encodeValuesOnly: true,
              })
            : undefined,
        ],
        // /count is stripped by the deriver -> collection topic subscription.
        // Topics survive even when a project passes reactQueryOptions.meta.
        meta: { topics: deriveTopicsFromPath(route), ...(userMeta ?? {}) },
        queryFn: countQuery({
          ...factoryProps,
          cb: (data) => {
            addToGlobalStore({
              name: route,
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
        ...restReactQueryOptions,
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

      const { onSuccess: userOnSuccess, ...restReactQueryOptions } =
        props?.reactQueryOptions ?? {};

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
        onSuccess: async (data, variables, onMutateResult, context) => {
          // 1. Internal cache handling - patch list cache before user callback.
          if (data && typeof data === "object" && "id" in data) {
            const item = data as T & { id: string };
            appendToListQueries(
              factoryProps.queryClient,
              factoryProps.route,
              item,
            );
            void factoryProps.queryClient.invalidateQueries({
              queryKey: [`${factoryProps.route}/count`],
            });
          }
          // 2. User's onSuccess runs after internal cache handling.
          await userOnSuccess?.(data, variables, onMutateResult, context);
        },
        ...restReactQueryOptions,
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

      const { onSuccess: userOnSuccess, ...restReactQueryOptions } =
        props?.reactQueryOptions ?? {};

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
        onSuccess: async (data, variables, onMutateResult, context) => {
          // 1. Internal cache handling - patch list and findById caches.
          if (data && typeof data === "object" && "id" in data) {
            const item = data as T & { id: string };
            patchInListQueries(
              factoryProps.queryClient,
              factoryProps.route,
              item.id,
              item,
            );
            // Also patch the findById cache (key prefix route/id).
            const findByIdQueries = factoryProps.queryClient
              .getQueryCache()
              .findAll({ queryKey: [`${factoryProps.route}/${item.id}`] });
            for (const q of findByIdQueries) {
              factoryProps.queryClient.setQueryData<T>(q.queryKey, (old) => {
                if (!old || typeof old !== "object") return old;
                return { ...old, ...item };
              });
            }
          }
          // 2. User's onSuccess.
          await userOnSuccess?.(data, variables, onMutateResult, context);
        },
        ...restReactQueryOptions,
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

      const { onSuccess: userOnSuccess, ...restReactQueryOptions } =
        props?.reactQueryOptions ?? {};

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
        onSuccess: async (data, variables, onMutateResult, context) => {
          // 1. Internal cache handling - remove from lists and findById cache.
          if (data && typeof data === "object" && "id" in data) {
            const item = data as T & { id: string };
            removeFromListQueries(
              factoryProps.queryClient,
              factoryProps.route,
              item.id,
            );
            factoryProps.queryClient.removeQueries({
              queryKey: [`${factoryProps.route}/${item.id}`],
            });
            void factoryProps.queryClient.invalidateQueries({
              queryKey: [`${factoryProps.route}/count`],
            });
          } else {
            // Fallback: no usable id in response - targeted list invalidation.
            void factoryProps.queryClient.invalidateQueries({
              queryKey: [factoryProps.route],
            });
          }
          // 2. User's onSuccess.
          await userOnSuccess?.(data, variables, onMutateResult, context);
        },
        ...restReactQueryOptions,
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
