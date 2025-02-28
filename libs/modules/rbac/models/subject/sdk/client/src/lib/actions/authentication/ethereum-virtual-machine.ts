"use client";

import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import {
  DefaultError,
  useMutation,
  UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/rbac/models/subject/sdk/server";

export type IProps = {
  reactQueryOptions?: Partial<UseMutationOptions<any, DefaultError, any>>;
};

export type IResult =
  IParentResult["IAuthenticationEthereumVirtualMachineResult"];

export function action(props: IProps) {
  return useMutation<
    IResult,
    DefaultError,
    IParentProps["IAuthenticationEthereumVirtualMachineProps"]
  >({
    mutationKey: [`${route}/authentication/ethereum-virtual-machine`],
    mutationFn: async (
      mutationFunctionProps: IParentProps["IAuthenticationEthereumVirtualMachineProps"],
    ) => {
      try {
        const result = await api.authenticationEthereumVirtualMachine({
          ...mutationFunctionProps,
          host: clientHost,
        });

        localStorage.setItem("rbac.subject.refresh", result.refresh);

        return result;
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
}
