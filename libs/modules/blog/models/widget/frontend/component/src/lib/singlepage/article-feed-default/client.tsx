"use client";
import { useCallback, useEffect, useState } from "react";
import { api as articleApi } from "@sps/blog/models/article/sdk/client";
import { useClientComposition } from "@sps/blog/frontend/component/provider";
import { Component as ChildComponent } from "./ClientComponent";
import { Skeleton } from "./Skeleton";
import type { IComponentPropsExtended } from "./interface";

/** The saved Widget uses the shared reader; this reader owns its paginated domain query. */
export default function Client(props: IComponentPropsExtended) {
  const composition = useClientComposition();
  const [page, setPage] = useState(0);
  const limit = 6;
  const entries = articleApi.find({
    params: {
      limit,
      offset: page * limit,
      orderBy: {
        and: [
          { column: "createdAt", method: "desc" },
          { column: "id", method: "asc" },
        ],
      },
    },
  });
  const count = articleApi.count({});
  const total = count.data ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  useEffect(() => {
    if (count.data !== undefined && page >= pages) setPage(pages - 1);
  }, [count.data, page, pages]);
  const previous = useCallback(
    () => setPage((current) => Math.max(0, current - 1)),
    [],
  );
  const next = useCallback(
    () => setPage((current) => Math.min(pages - 1, current + 1)),
    [pages],
  );
  const retry = useCallback(() => {
    void entries.refetch();
    void count.refetch();
  }, [entries.refetch, count.refetch]);
  if (entries.isPending || count.isPending) return <Skeleton />;
  const failed =
    (entries.isError && !entries.data) ||
    (count.isError && count.data === undefined);
  return (
    <ChildComponent
      data={props.data}
      language={props.language}
      variant={props.variant}
      className={props.className}
      entries={entries.data ?? []}
      page={page}
      pages={pages}
      total={total}
      fetching={entries.isFetching}
      failed={failed}
      onPrevious={previous}
      onNext={next}
      onRetry={retry}
      renderAuthor={props.renderAuthor ?? composition.renderAuthor}
    />
  );
}
