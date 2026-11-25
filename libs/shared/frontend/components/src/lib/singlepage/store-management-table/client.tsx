"use client";

import { useEffect, useState } from "react";
import { ClientComponent as ChildComponent } from "./ClientComponent";
import { firstPage, type IClientReaderProps } from "./interface";

export function Component<T>(props: IClientReaderProps<T>) {
  const { usePage, initialData } = props;
  const [params, setParams] = useState(firstPage);
  const isFirstPage =
    params.offset === 0 && !params.search && params.limit === firstPage.limit;
  const query = usePage(params, isFirstPage ? initialData : undefined);
  const data = query.denied ? undefined : query.data;
  const total = data?.total;

  // The last page may disappear after a deletion or a permission change.
  useEffect(() => {
    if (total === undefined) return;
    const lastOffset = Math.max(
      0,
      (Math.ceil(total / params.limit) - 1) * params.limit,
    );
    if (params.offset > lastOffset) {
      setParams((current) =>
        current === params ? { ...params, offset: lastOffset } : current,
      );
    }
  }, [params, total]);

  return (
    <ChildComponent
      language={props.language}
      title={props.title}
      action={query.showAction === false ? undefined : props.action}
      header={props.header}
      searchPlaceholder={props.searchPlaceholder}
      emptyMessage={props.emptyMessage}
      deniedMessage={props.deniedMessage}
      className={props.className}
      listClassName={props.listClassName}
      params={params}
      setParams={setParams}
      total={total}
      count={data?.items.length ?? 0}
      denied={query.denied === true}
      isError={query.isError}
      onRetry={query.refetch}
      rows={data?.items.map(props.renderRow)}
    />
  );
}
