"use client";

import { actions, ICreateProps } from "@sps/shared-frontend-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { toast } from "sonner";

export interface IMutationProps<T> {
  options?: ICreateProps["options"];
  params?: ICreateProps["params"];
  host: string;
  route: string;
  cb?: (data: T) => void;
}

export interface IMutationFunctionProps {
  data: ICreateProps["data"];
  options?: ICreateProps["options"];
  params?: ICreateProps["params"];
}

export function mutation<T>(
  props: IMutationProps<T>,
): (mutationFunctionProps: IMutationFunctionProps) => Promise<T> {
  return async (mutationFunctionProps: IMutationFunctionProps) => {
    try {
      const res = await actions.create<T>({
        host: props.host,
        route: props.route,
        params: mutationFunctionProps.params || props.params,
        options: {
          ...mutationFunctionProps.options,
          ...props.options,
          headers: saturateHeaders(mutationFunctionProps.options?.headers),
        },
        data: mutationFunctionProps.data,
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
