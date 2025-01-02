"use client";

import { actions, IFindByIdProps } from "@sps/shared-frontend-api";
import { toast } from "sonner";

export interface IQueryProps<T> {
  id: IFindByIdProps["id"];
  params?: IFindByIdProps["params"];
  options?: IFindByIdProps["options"];
  host: string;
  route: string;
  cb?: (data: T | undefined) => void;
}

export function query<T>(props: IQueryProps<T>): () => Promise<T | undefined> {
  return async () => {
    try {
      const res = await actions.findById<T>({
        id: props.id,
        host: props.host,
        route: props.route,
        params: props.params,
        options: {
          ...props.options,
        },
      });

      if (props.cb) {
        props.cb(res);
      }

      return res;
    } catch (error: any) {
      toast.error(error.message);

      throw error;
    }
  };
}
