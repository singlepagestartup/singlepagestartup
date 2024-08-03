"use client";

import { actions, IUpdateActionProps } from "@sps/shared-frontend-api";
import { toast } from "sonner";

export interface IMutationProps<T> {
  host: string;
  route: string;
  id?: IUpdateActionProps["id"];
  options?: IUpdateActionProps["options"];
  params?: IUpdateActionProps["params"];
  cb?: (data: T) => void;
}

export interface IMutationFunctionProps {
  id?: IUpdateActionProps["id"];
  data: IUpdateActionProps["data"];
  options?: IUpdateActionProps["options"];
  params?: IUpdateActionProps["params"];
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
