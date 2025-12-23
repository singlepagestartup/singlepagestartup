"use client";

import { actions, IUpdateProps } from "@sps/shared-frontend-api";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { parseJwt } from "libs/shared/frontend/client/utils/src/lib/authorization";
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
      const cookies = document.cookie;

      const jwt = cookies
        .split("; ")
        .find((cookie) => cookie.startsWith("rbac.subject.jwt="))
        ?.split("=")[1];

      if (jwt) {
        const parsedJwt = parseJwt(jwt);

        if (
          parsedJwt?.["exp"] &&
          new Date(parsedJwt.exp * 1000).getTime() < new Date().getTime()
        ) {
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve("");
            }, 1000);
          });
        }
      }

      const id = mutationFunctionProps.id || props.id;

      if (!id) {
        throw new Error("Validation error. id is required");
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
