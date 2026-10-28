"use client";
import { useCallback, useEffect, useState } from "react";
import { api as profileApi } from "@sps/social/models/profile/sdk/client";
import { Component as ChildComponent } from "./ClientComponent";
import { Skeleton } from "./Skeleton";
import type { IComponentPropsExtended } from "./interface";

/** The saved Widget uses the shared reader; this reader owns its paginated domain query. */
export default function Client(props: IComponentPropsExtended) {
  const [page, setPage] = useState(0);
  const limit = 12;
  const entries = profileApi.authorFind({
    params: { limit, offset: page * limit },
  });
  const count = profileApi.authorFindCount({});
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
    />
  );
}
