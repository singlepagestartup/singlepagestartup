"use client";

import { actions, IDeleteProps } from "@sps/shared-frontend-api";
import { toast } from "sonner";

export interface IMutationProps<T> {
  id?: IDeleteProps["id"];
  options?: IDeleteProps["options"];
  params?: IDeleteProps["params"];
  host: string;
  route: string;
  cb?: (data: T) => void;
}

export interface IMutationFunctionProps {
  id?: IDeleteProps["id"];
  options?: IDeleteProps["options"];
  params?: IDeleteProps["params"];
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

      const res = await actions.delete<T>({
        id,
        host: props.host,
        route: props.route,
        params: mutationFunctionProps.params || props.params,
        options: {
          ...mutationFunctionProps.options,
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
