import { useMemo } from "react";

export function getAdminRoutePath(pathname: string | null): string {
  const value = pathname || "";
  const adminIndex = value.indexOf("/admin");

  if (adminIndex === -1) {
    return "/";
  }

  const next = value.slice(adminIndex + "/admin".length) || "/";
  return next.replace(/\/+$/, "") || "/";
}

export function useAdminRoutePath(pathname: string | null) {
  return useMemo(() => getAdminRoutePath(pathname), [pathname]);
}

export function parseAdminRoute(path: string): {
  module: string | null;
  model: string | null;
} {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const routeMatch = normalized.match(
    /^\/modules\/([^/]+)(?:\/models\/([^/]+))?$/,
  );

  return {
    module: routeMatch?.[1] || null,
    model: routeMatch?.[2] || null,
  };
}

export function useAdminRoute(pathname: string | null) {
  const currentPath = useAdminRoutePath(pathname);
  const route = useMemo(() => parseAdminRoute(currentPath), [currentPath]);
  return { currentPath, ...route };
}

export function getAdminBasePath(pathname: string): string {
  const adminIndex = pathname.indexOf("/admin");

  if (adminIndex === -1) {
    return "/admin";
  }

  return pathname.slice(0, adminIndex + "/admin".length);
}

export function useAdminBasePath(pathname: string) {
  return useMemo(() => getAdminBasePath(pathname), [pathname]);
}
