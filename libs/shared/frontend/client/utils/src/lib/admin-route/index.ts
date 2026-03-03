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
  const segments = normalized.split("/").filter(Boolean);

  return {
    module: segments[0] || null,
    model: segments[1] || null,
  };
}

export function useAdminRoute(pathname: string | null) {
  const currentPath = useAdminRoutePath(pathname);
  const route = useMemo(() => parseAdminRoute(currentPath), [currentPath]);
  return { currentPath, ...route };
}

export function getAdminBasePath(_pathname: string): string {
  return "/admin";
}

export function useAdminBasePath(pathname: string) {
  return useMemo(() => getAdminBasePath(pathname), [pathname]);
}
