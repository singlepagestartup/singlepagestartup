"use client";

import Cookies from "js-cookie";
import { authorization } from "@sps/shared-frontend-client-utils";

export const AUTHENTICATION_STORAGE_EVENT = "sps-rbac-auth-storage-change";

type IProps = {
  jwt: string;
  refresh: string;
};

function dispatchAuthenticationStorageEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTHENTICATION_STORAGE_EVENT));
}

export function persistAuthenticationTokens(props: IProps) {
  localStorage.setItem("rbac.subject.refresh", props.refresh);

  let expires: Date | undefined;

  try {
    const parsedJwt = authorization.parseJwt(props.jwt) as { exp?: number };

    if (typeof parsedJwt?.exp === "number") {
      expires = new Date(parsedJwt.exp * 1000);
    }
  } catch {
    expires = undefined;
  }

  Cookies.set("rbac.subject.jwt", props.jwt, {
    path: "/",
    sameSite: "strict",
    ...(expires ? { expires } : {}),
    ...(typeof window !== "undefined" && window.location.protocol === "https:"
      ? { secure: true }
      : {}),
  });

  dispatchAuthenticationStorageEvent();
}

export function clearAuthenticationTokens() {
  localStorage.removeItem("rbac.subject.refresh");
  Cookies.remove("rbac.subject.jwt", {
    path: "/",
  });
  Cookies.remove("rbac.subject.jwt");

  dispatchAuthenticationStorageEvent();
}
