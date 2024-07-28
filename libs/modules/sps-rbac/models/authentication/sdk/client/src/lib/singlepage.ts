"use client";

import {
  IModel,
  route,
  host,
  query,
  options,
} from "@sps/sps-rbac/models/authentication/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
import { DefaultError, useMutation, useQuery } from "@tanstack/react-query";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  STALE_TIME,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import { authorization } from "@sps/shared-frontend-client-utils";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export interface ILoginAndPasswordMutationFunctionProps {
  data: {
    login: string;
    password: string;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface ILogoutMutationFunctionProps {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IIsAuthorizedProps {
  params: {
    route: string;
    method: string;
    type?: "http";
  };
  options?: NextRequestOptions;
}

export const api = {
  ...factory<IModel>({
    queryClient,
    route,
    host,
    params: query,
    options,
  }),
  loginAndPassword: (props?: {
    type?: "authentication" | "registration";
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
  }) => {
    return useMutation<
      { jwt: string; refresh: string },
      DefaultError,
      ILoginAndPasswordMutationFunctionProps
    >({
      mutationKey: [
        `${route}/${props?.type ?? "authentication"}/login-and-password`,
      ],
      mutationFn: async (
        mutationFunctionProps: ILoginAndPasswordMutationFunctionProps,
      ) => {
        const { data } = mutationFunctionProps;

        const formData = prepareFormDataToSend({ data });

        const stringifiedQuery = QueryString.stringify(
          mutationFunctionProps.params || props?.params,
          {
            encodeValuesOnly: true,
          },
        );

        const requestOptions: NextRequestOptions = {
          credentials: "include",
          method: "POST",
          body: formData,
          ...(mutationFunctionProps.options || props?.options),
          next: {
            ...(mutationFunctionProps.options?.next || props?.options?.next),
          },
        };
        const res = await fetch(
          `${host}${route}/${props?.type ?? "authentication"}/login-and-password?${stringifiedQuery}`,
          requestOptions,
        );

        if (!res.ok) {
          const error = new Error(res.statusText);

          throw new Error(error.message || "Failed to fetch data");
        }

        const json = await res.json();

        if (json.error) {
          throw new Error(json.error.message || "Failed to fetch data");
        }
        const transformedData = transformResponseItem<{
          jwt: string;
          refresh: string;
        }>(json);

        return transformedData;
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "authentication.loginAndPassword",
          name: `${route}/${props?.type ?? "authentication"}/login-and-password`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
    });
  },
  logout: (props?: {
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
  }) => {
    return useMutation<
      { ok: true },
      DefaultError,
      ILogoutMutationFunctionProps
    >({
      mutationKey: [`${route}/logout`],
      mutationFn: async (
        mutationFunctionProps?: ILogoutMutationFunctionProps,
      ) => {
        const formData = prepareFormDataToSend({ data: {} });

        const stringifiedQuery = QueryString.stringify(
          mutationFunctionProps?.params || props?.params,
          {
            encodeValuesOnly: true,
          },
        );

        const requestOptions: NextRequestOptions = {
          credentials: "include",
          method: "POST",
          body: formData,
          ...(mutationFunctionProps?.options || props?.options),
          next: {
            ...(mutationFunctionProps?.options?.next || props?.options?.next),
          },
        };

        const res = await fetch(
          `${host}${route}/logout?${stringifiedQuery}`,
          requestOptions,
        );

        if (!res.ok) {
          const error = new Error(res.statusText);

          throw new Error(error.message || "Failed to fetch data");
        }

        const json = await res.json();

        if (json.error) {
          throw new Error(json.error.message || "Failed to fetch data");
        }
        const transformedData = transformResponseItem<{ ok: true }>(json);

        return transformedData;
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "logout",
          name: `${route}/logout`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
    });
  },
  isAuthorized: (props: {
    params: IIsAuthorizedProps["params"];
    options?: IIsAuthorizedProps["options"];
  }) => {
    return useQuery<IModel>({
      queryKey: [`${route}/is-authorized`],
      queryFn: async () => {
        const headers = authorization.headers();

        const stringifiedQuery = QueryString.stringify(props?.params, {
          encodeValuesOnly: true,
        });

        const requestOptions: NextRequestOptions = {
          credentials: "include",
          headers,
          ...options,
          next: {
            ...options?.next,
          },
        };

        const res = await fetch(
          `${host}${route}/is-authorized?${stringifiedQuery}`,
          requestOptions,
        );

        if (!res.ok) {
          const error = new Error(res.statusText);

          throw new Error(error.message || "Failed to fetch data");
        }

        const json = await res.json();

        if (json.error) {
          throw new Error(json.error.message || "Failed to fetch data");
        }

        const transformedData = transformResponseItem<IModel>(json);

        return transformedData;
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "is-authorized",
          name: `${route}/is-authorized`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
    });
  },
};
