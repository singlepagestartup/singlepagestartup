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

export function readAuthenticationTokens() {
  return {
    jwt: Cookies.get("rbac.subject.jwt"),
    refresh: localStorage.getItem("rbac.subject.refresh"),
  };
}

export function persistAuthenticationTokens(
  props: IProps,
  previous?: ReturnType<typeof readAuthenticationTokens>,
) {
  if (previous) {
    const current = readAuthenticationTokens();
    if (current.jwt !== previous.jwt || current.refresh !== previous.refresh) {
      return;
    }
  }

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

export function clearRejectedAccessToken(authorization: string | null) {
  const jwt = Cookies.get("rbac.subject.jwt");
  if (jwt && authorization === `Bearer ${jwt}`) {
    removeAuthenticationCookie();
    dispatchAuthenticationStorageEvent();
  }
}

export function clearRejectedRefreshToken(refresh: string) {
  if (localStorage.getItem("rbac.subject.refresh") === refresh) {
    clearAuthenticationTokens();
  }
}

function removeAuthenticationCookie() {
  Cookies.remove("rbac.subject.jwt", {
    path: "/",
  });
  Cookies.remove("rbac.subject.jwt");
}

export function clearAuthenticationTokens() {
  localStorage.removeItem("rbac.subject.refresh");
  removeAuthenticationCookie();
  dispatchAuthenticationStorageEvent();
}
