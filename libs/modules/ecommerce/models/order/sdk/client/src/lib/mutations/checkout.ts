"use client";

import { IModel } from "@sps/ecommerce/models/order/sdk/model";
import { toast } from "sonner";
import { action, IProps } from "../../../../server/src/lib/actions/checkout";

export interface IMutationProps {
  id: IProps["id"];
  options?: IProps["options"];
  params?: IProps["params"];
  cb?: (data: IModel) => void;
}

export interface IMutationFunctionProps {
  id?: IProps["id"];
  data: IProps["data"];
  options?: IProps["options"];
  params?: IProps["params"];
}

export function mutation(
  props: IMutationProps,
): (mutationFunctionProps: IMutationFunctionProps) => Promise<IModel> {
  return async (mutationFunctionProps: IMutationFunctionProps) => {
    try {
      const id = mutationFunctionProps.id || props.id;

      if (!id) {
        throw new Error("id is required");
      }

      const res = await action({
        id,
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
