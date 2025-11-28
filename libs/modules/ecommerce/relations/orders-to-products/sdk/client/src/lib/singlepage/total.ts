"use client";

import { STALE_TIME } from "@sps/shared-utils";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import {
  route,
  clientHost,
} from "@sps/ecommerce/relations/orders-to-products/sdk/model";
import { toast } from "sonner";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  api,
  type IProps as IParentProps,
  type IResult as IParentResult,
} from "@sps/ecommerce/relations/orders-to-products/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";

export type IProps = IParentProps["ITotalProps"] & {
  reactQueryOptions?: Partial<UseQueryOptions<any>>;
};

export type IResult = IParentResult["ITotalResult"];

export function action(props: IProps) {
  subscription(`${route}/${props.id}/total`, queryClient);

  return useQuery<IResult>({
    queryKey: [`${route}/${props.id}/total`],
    queryFn: async () => {
      try {
        const result = await api.total({
          ...props,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
          },
          host: clientHost,
        });

        return result;
      } catch (error: any) {
        toast.error(error.message);

        throw error;
      }
    },
    select(data) {
      globalActionsStore.getState().addAction({
        type: "query",
        name: `${route}/${props.id}/total`,
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
}
