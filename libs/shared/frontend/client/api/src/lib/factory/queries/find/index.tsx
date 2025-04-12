"use client";

import { actions, IFindProps } from "@sps/shared-frontend-api";
import { toast } from "sonner";
import { requestLimiter } from "../../../request-limmiter";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export interface IQueryProps<T> {
  params?: IFindProps["params"];
  options?: IFindProps["options"];
  host: string;
  route: string;
  cb?: (data: T[] | undefined) => void;
}

export function query<T>(
  props: IQueryProps<T>,
): () => Promise<T[] | undefined> {
  return async () => {
    try {
      return await requestLimiter.run(async () => {
        const res = await actions.find<T>({
          host: props.host,
          route: props.route,
          params: props.params,
          options: {
            ...props.options,
            headers: saturateHeaders(props.options?.headers),
          },
        });

        if (props.cb) {
          props.cb(res);
        }

        return res;
      });
    } catch (error: any) {
      toast.error(error.message);

      throw error;
    }
  };
}
