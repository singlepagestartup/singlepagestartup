"use client";

import { actions, ICreateActionProps } from "@sps/shared-frontend-api";
import { authorization } from "@sps/shared-frontend-client-utils";

export interface IMutationProps<T> {
  options?: ICreateActionProps["options"];
  params?: ICreateActionProps["params"];
  host: string;
  route: string;
  cb?: (data: T) => void;
}

export interface IMutationFunctionProps {
  data: ICreateActionProps["data"];
  options?: ICreateActionProps["options"];
  params?: ICreateActionProps["params"];
}

export function mutation<T>(
  props: IMutationProps<T>,
): (mutationFunctionProps: IMutationFunctionProps) => Promise<T> {
  return async (mutationFunctionProps: IMutationFunctionProps) => {
    const headers = authorization.headers();

    const res = await actions.create<T>({
      host: props.host,
      route: props.route,
      params: mutationFunctionProps.params || props.params,
      options: {
        headers,
        ...mutationFunctionProps.options,
        ...props.options,
      },
      data: mutationFunctionProps.data,
    });

    if (props.cb) {
      props.cb(res);
    }

    return res;
  };
}
