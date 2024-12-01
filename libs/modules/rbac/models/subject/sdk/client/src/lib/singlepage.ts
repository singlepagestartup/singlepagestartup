"use client";

import {
  IModel,
  route,
  host,
  query,
  options,
} from "@sps/rbac/models/subject/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";
import { DefaultError, useMutation, useQuery } from "@tanstack/react-query";
import {
  NextRequestOptions,
  prepareFormDataToSend,
  STALE_TIME,
  responsePipe,
  transformResponseItem,
} from "@sps/shared-utils";
import QueryString from "qs";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { Address, Hex } from "viem";
import { api as serverApi } from "../../../server";
import { IExtendedModel as IEcommerceProductCheckoutResult } from "../../../server/src/lib/actions/ecommerce-products-checkout";
import { IExtendedModel as IEcommerceProductsCartResult } from "../../../server/src/lib/actions/ecommerce-orders-create";
import { IExtendedModel as IEcommerceOrdersCheckoutResult } from "../../../server/src/lib/actions/ecommerce-orders-checkout";

export interface IMeProps {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IInitProps {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IInitMutationFunctionProps {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

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

export interface IEcommerceProductCheckoutMutationFunctionProps {
  data: {
    quantity: number;
    provider: string;
    email?: string;
    comment?: string;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IEcommerceProductsCartMutationFunctionProps {
  data: {
    productId: string;
    quantity: number;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IEcommerceOrdersUpdateMutationFunctionProps {
  data: {
    quantity: number;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IEcommerceOrdersCheckoutMutationFunctionProps {
  data: {
    provider: string;
    email?: string;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IEcommerceOrdersDeleteMutationFunctionProps {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IIdentitiesDeleteMutationFunctionProps {
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IIdentitiesUpdateMutationFunctionProps {
  data: {
    [key: string]: any;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IIdentitiesCreateMutationFunctionProps {
  data: {
    [key: string]: any;
  };
  params?: {
    [key: string]: any;
  };
  options?: NextRequestOptions;
}

export interface IRefreshMutationFunctionProps {
  data: {
    refresh: string;
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
    action: {
      route: string;
      method: string;
      type?: "HTTP";
    };
  };
  options?: NextRequestOptions;
}

export interface IEthereumVirtualMachineMutationFunctionProps {
  data: {
    address: Address;
    message: string;
    signature: Hex;
  };
  params?: {
    [key: string]: any;
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
  init: (props?: {
    params?: IInitProps["params"];
    options?: IInitProps["options"];
    reactQueryOptions?: any;
  }) => {
    return useQuery<{ jwt: string; refresh: string }>({
      queryKey: [`${route}/init`],
      queryFn: async () => {
        try {
          const stringifiedQuery = QueryString.stringify(props?.params, {
            encodeValuesOnly: true,
          });

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            ...options,
            next: {
              ...options?.next,
            },
          };

          const res = await fetch(
            `${host}${route}/init?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{
            data: {
              jwt: string;
              refresh: string;
            };
          }>({
            res,
          });

          const transformedData = transformResponseItem<{
            jwt: string;
            refresh: string;
          }>(json);

          localStorage.setItem("rbac.subject.refresh", transformedData.refresh);
          Cookies.set("rbac.subject.jwt", transformedData.jwt);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "query",
          name: `${route}/is-authorized`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
      ...(props ? props.reactQueryOptions : {}),
    });
  },
  me: (props?: {
    params?: IMeProps["params"];
    options?: IMeProps["options"];
    reactQueryOptions?: any;
    mute?: boolean;
  }) => {
    return useQuery<IModel>({
      queryKey: [`${route}/me`],
      queryFn: async () => {
        try {
          const stringifiedQuery = QueryString.stringify(props?.params, {
            encodeValuesOnly: true,
          });

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            ...options,
            next: {
              ...options?.next,
            },
          };

          const res = await fetch(
            `${host}${route}/me?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{
            data: IModel;
          }>({
            res,
          });

          const transformedData = transformResponseItem<IModel>(json);

          return transformedData;
        } catch (error: any) {
          if (!props?.mute) {
            toast.error(error.message);
          }

          throw error;
        }
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "query",
          name: `${route}/me`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
      ...(props ? props.reactQueryOptions : {}),
    });
  },
  loginAndPassword: (props?: {
    type?: "authentication" | "registration";
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
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
        try {
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

          const json = await responsePipe<{
            data: {
              jwt: string;
              refresh: string;
            };
          }>({
            res,
          });

          const transformedData = transformResponseItem<{
            jwt: string;
            refresh: string;
          }>(json);

          localStorage.setItem("rbac.subject.refresh", transformedData.refresh);
          Cookies.set("rbac.subject.jwt", transformedData.jwt);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props?.type ?? "authentication"}/login-and-password`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  refresh: (props?: {
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      { jwt: string; refresh: string },
      DefaultError,
      IRefreshMutationFunctionProps
    >({
      mutationKey: [`${route}/authentication/refresh`],
      mutationFn: async (
        mutationFunctionProps: IRefreshMutationFunctionProps,
      ) => {
        try {
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
            `${host}${route}/authentication/refresh?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{
            data: {
              jwt: string;
              refresh: string;
            };
          }>({
            res,
          });

          const transformedData = transformResponseItem<{
            jwt: string;
            refresh: string;
          }>(json);

          localStorage.setItem("rbac.subject.refresh", transformedData.refresh);
          Cookies.set("rbac.subject.jwt", transformedData.jwt);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/authentication/refresh`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  logout: (props?: {
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useQuery<IModel>({
      queryKey: [`${route}/logout`],
      queryFn: async () => {
        try {
          const stringifiedQuery = QueryString.stringify(props?.params, {
            encodeValuesOnly: true,
          });

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            ...options,
            cache: "no-cache",
            next: {
              ...options?.next,
              cache: "no-store",
            },
          };

          const res = await fetch(
            `${host}${route}/logout?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{ data: IModel }>({
            res,
          });

          const transformedData = transformResponseItem<IModel>(json);

          localStorage.removeItem("rbac.subject.refresh");
          Cookies.remove("rbac.subject.jwt");

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/logout`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
      ...props?.reactQueryOptions,
    });
  },
  isAuthorized: (props: {
    params: IIsAuthorizedProps["params"];
    options?: IIsAuthorizedProps["options"];
    reactQueryOptions?: any;
  }) => {
    return useQuery<IModel>({
      queryKey: [`${route}/is-authorized`],
      queryFn: async () => {
        try {
          const stringifiedQuery = QueryString.stringify(props?.params, {
            encodeValuesOnly: true,
          });

          const requestOptions: NextRequestOptions = {
            credentials: "include",
            ...options,
            next: {
              ...options?.next,
            },
          };

          const res = await fetch(
            `${host}${route}/is-authorized?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{ data: IModel }>({
            res,
          });

          const transformedData = transformResponseItem<IModel>(json);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      select(data) {
        globalActionsStore.getState().addAction({
          type: "query",
          name: `${route}/is-authorized`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      staleTime: STALE_TIME,
      ...props.reactQueryOptions,
    });
  },
  ethereumVirtualMachine: (props?: {
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      { jwt: string; refresh: string },
      DefaultError,
      IEthereumVirtualMachineMutationFunctionProps
    >({
      mutationKey: [`${route}/authentication/ethereum-virtual-machine`],
      mutationFn: async (
        mutationFunctionProps: IEthereumVirtualMachineMutationFunctionProps,
      ) => {
        try {
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
            `${host}${route}/authentication/ethereum-virtual-machine?${stringifiedQuery}`,
            requestOptions,
          );

          const json = await responsePipe<{
            data: {
              jwt: string;
              refresh: string;
            };
          }>({
            res,
          });

          const transformedData = transformResponseItem<{
            jwt: string;
            refresh: string;
          }>(json);

          localStorage.setItem("rbac.subject.refresh", transformedData.refresh);

          return transformedData;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/authentication/ethereum-virtual-machine`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  ecommerceProductCheckout: (props: {
    id: string;
    productId?: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IEcommerceProductCheckoutResult,
      DefaultError,
      IEcommerceProductCheckoutMutationFunctionProps
    >({
      mutationKey: [
        `${route}/${props.id}/ecommerce/products/${props?.productId || "productId"}/checkout`,
      ],
      mutationFn: async (
        mutationFunctionProps: IEcommerceProductCheckoutMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.ecommerceProductsCheckout({
            id: props.id,
            productId: props.productId,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/ecommerce/products/${props.productId || "productId"}/checkout`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  ecommerceOrdersCreate: (props: {
    id: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IEcommerceProductsCartResult,
      DefaultError,
      IEcommerceProductsCartMutationFunctionProps
    >({
      mutationKey: [`${route}/${props.id}/ecommerce/orders`],
      mutationFn: async (
        mutationFunctionProps: IEcommerceProductsCartMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.ecommerceOrdersCreate({
            id: props.id,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/ecommerce/orders`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  ecommerceOrdersUpdate: (props: {
    id: string;
    orderId?: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IModel,
      DefaultError,
      IEcommerceOrdersUpdateMutationFunctionProps
    >({
      mutationKey: [
        `${route}/${props.id}/ecommerce/orders/${props?.orderId || "orderId"}`,
      ],
      mutationFn: async (
        mutationFunctionProps: IEcommerceOrdersUpdateMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.ecommerceOrdersUpdate({
            id: props.id,
            orderId: props.orderId,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/ecommerce/orders/${props.orderId || "orderId"}`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  ecommerceOrdersCheckout: (props: {
    id: string;
    orderId: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IEcommerceOrdersCheckoutResult,
      DefaultError,
      IEcommerceOrdersCheckoutMutationFunctionProps
    >({
      mutationKey: [
        `${route}/${props.id}/ecommerce/orders/${props.orderId}/checkout`,
      ],
      mutationFn: async (
        mutationFunctionProps: IEcommerceOrdersCheckoutMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.ecommerceOrdersCheckout({
            id: props.id,
            orderId: props.orderId,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/ecommerce/orders/${props.orderId}/checkout`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  ecommerceOrdersDelete: (props: {
    id: string;
    orderId: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IModel,
      DefaultError,
      IEcommerceOrdersDeleteMutationFunctionProps
    >({
      mutationKey: [`${route}/${props.id}/ecommerce/orders/${props.orderId}`],
      mutationFn: async (
        mutationFunctionProps: IEcommerceOrdersDeleteMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.ecommerceOrdersDelete({
            id: props.id,
            orderId: props.orderId,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/ecommerce/orders/${props.orderId}`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  identitiesUpdate: (props: {
    id: string;
    identityId: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IModel,
      DefaultError,
      IIdentitiesUpdateMutationFunctionProps
    >({
      mutationKey: [`${route}/${props.id}/identities/${props.identityId}`],
      mutationFn: async (
        mutationFunctionProps: IIdentitiesUpdateMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.identitiesUpdate({
            id: props.id,
            identityId: props.identityId,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/identities/${props.identityId}`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  identitiesDelete: (props: {
    id: string;
    identityId: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IModel,
      DefaultError,
      IIdentitiesDeleteMutationFunctionProps
    >({
      mutationKey: [`${route}/${props.id}/identities/${props.identityId}`],
      mutationFn: async (
        mutationFunctionProps: IIdentitiesDeleteMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.identitiesDelete({
            id: props.id,
            identityId: props.identityId,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/identities/${props.identityId}`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
  identitiesCreate: (props: {
    id: string;
    params?: {
      [key: string]: any;
    };
    options?: NextRequestOptions;
    reactQueryOptions?: any;
  }) => {
    return useMutation<
      IModel,
      DefaultError,
      IIdentitiesCreateMutationFunctionProps
    >({
      mutationKey: [`${route}/${props.id}/identities`],
      mutationFn: async (
        mutationFunctionProps: IIdentitiesCreateMutationFunctionProps,
      ) => {
        try {
          const result = serverApi.identitiesCreate({
            id: props.id,
            ...mutationFunctionProps,
          });

          return result;
        } catch (error: any) {
          toast.error(error.message);

          throw error;
        }
      },
      onSuccess(data) {
        globalActionsStore.getState().addAction({
          type: "mutation",
          name: `${route}/${props.id}/identities`,
          props: this,
          result: data,
          timestamp: Date.now(),
          requestId: createId(),
        });

        return data;
      },
      ...props?.reactQueryOptions,
    });
  },
};
