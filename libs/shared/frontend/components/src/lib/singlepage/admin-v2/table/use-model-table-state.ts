"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type TModelTableSortBy = "id" | "title" | "slug";

type TStateOptions = {
  defaultItemsPerPage?: number;
};

type TEntityLike = {
  id?: string;
  adminTitle?: string;
  title?: unknown;
  slug?: string;
};

function toPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value || "");
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function normalizeTitle(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const byLanguage = String(record.en || "") || String(record.ru || "") || "";
    if (byLanguage) {
      return byLanguage;
    }
  }

  return String(value);
}

function compareText(left: unknown, right: unknown): number {
  return String(left || "").localeCompare(String(right || ""));
}

export function useAdminV2ModelTableState(options?: TStateOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultItemsPerPage = options?.defaultItemsPerPage ?? 4;
  const search = searchParams.get("q") || "";
  const sortBy = useMemo<TModelTableSortBy>(() => {
    const value = searchParams.get("sort");
    if (value === "title" || value === "slug") {
      return value;
    }

    return "id";
  }, [searchParams]);
  const currentPage = toPositiveInteger(searchParams.get("page"), 1);
  const itemsPerPage = toPositiveInteger(
    searchParams.get("perPage"),
    defaultItemsPerPage,
  );

  const updateParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(next).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
          return;
        }

        params.set(key, value);
      });

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      updateParams({
        q: value.trim() ? value : null,
        page: "1",
      });
    },
    [updateParams],
  );

  const setSortBy = useCallback(
    (value: TModelTableSortBy) => {
      updateParams({
        sort: value === "id" ? null : value,
        page: "1",
      });
    },
    [updateParams],
  );

  const setCurrentPage = useCallback(
    (value: number) => {
      updateParams({
        page: String(Math.max(1, Math.floor(value))),
      });
    },
    [updateParams],
  );

  const setItemsPerPage = useCallback(
    (value: number) => {
      updateParams({
        perPage:
          value === defaultItemsPerPage
            ? null
            : String(Math.max(1, Math.floor(value))),
        page: "1",
      });
    },
    [defaultItemsPerPage, updateParams],
  );

  return {
    search,
    sortBy,
    currentPage,
    itemsPerPage,
    setSearch,
    setSortBy,
    setCurrentPage,
    setItemsPerPage,
  };
}

export function getAdminV2ModelTablePage<T extends TEntityLike>(
  entities: T[],
  options: {
    search: string;
    sortBy: TModelTableSortBy;
    currentPage: number;
    itemsPerPage: number;
  },
) {
  const normalizedSearch = options.search.trim();
  const searchLower = normalizedSearch.toLowerCase();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      normalizedSearch,
    );

  const filtered = normalizedSearch
    ? entities.filter((entity) => {
        if (isUuid) {
          return String(entity.id || "") === normalizedSearch;
        }

        return String(entity.adminTitle || "")
          .toLowerCase()
          .includes(searchLower);
      })
    : entities;

  const sorted = [...filtered].sort((left, right) => {
    if (options.sortBy === "title") {
      return compareText(
        left.adminTitle || normalizeTitle(left.title),
        right.adminTitle || normalizeTitle(right.title),
      );
    }

    if (options.sortBy === "slug") {
      return compareText(left.slug, right.slug);
    }

    return compareText(left.id, right.id);
  });

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / options.itemsPerPage),
  );
  const safePage = Math.min(Math.max(1, options.currentPage), totalPages);
  const offset = (safePage - 1) * options.itemsPerPage;
  const paged = sorted.slice(offset, offset + options.itemsPerPage);

  return {
    filtered: sorted,
    paged,
    totalPages,
    currentPage: safePage,
  };
}
