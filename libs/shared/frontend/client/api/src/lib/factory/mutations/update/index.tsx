"use client";

import { actions, IUpdateProps } from "@sps/shared-frontend-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { toast } from "sonner";

export interface IMutationProps<T> {
  host: string;
  route: string;
  id?: IUpdateProps["id"];
  options?: IUpdateProps["options"];
  params?: IUpdateProps["params"];
  cb?: (data: T) => void;
}

export interface IMutationFunctionProps {
  id?: IUpdateProps["id"];
  data: IUpdateProps["data"];
  options?: IUpdateProps["options"];
  params?: IUpdateProps["params"];
}

export function mutation<T>(
  props: IMutationProps<T>,
): (mutationFunctionProps: IMutationFunctionProps) => Promise<T> {
  return async (mutationFunctionProps: IMutationFunctionProps) => {
    try {
      const id = mutationFunctionProps.id || props.id;

      if (!id) {
        throw new Error("id is required");
      }

      const res = await actions.update<T>({
        id,
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
