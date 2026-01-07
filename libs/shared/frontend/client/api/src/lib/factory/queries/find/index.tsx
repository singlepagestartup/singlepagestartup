"use client";

import { actions, IFindProps } from "@sps/shared-frontend-api";
import { toast } from "sonner";
import { requestLimiter } from "../../../request-limmiter";
import {
  authorization,
  saturateHeaders,
} from "@sps/shared-frontend-client-utils";

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
      const cookies = document.cookie;

      const jwt = cookies
        .split("; ")
        .find((cookie) => cookie.startsWith("rbac.subject.jwt="))
        ?.split("=")[1];

      if (jwt) {
        const parsedJwt = authorization.parseJwt(jwt);

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
      if (error.message.includes("404 |")) {
        throw error;
      }

      toast.error(error.message);

      throw error;
    }
  };
}
