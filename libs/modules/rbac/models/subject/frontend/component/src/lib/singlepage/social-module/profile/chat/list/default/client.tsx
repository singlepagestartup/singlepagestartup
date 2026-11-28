"use client";
import "client-only";

import { Component as ChildComponent } from "./Component";
import { useCallback, useDeferredValue, useState } from "react";
import {
  chatPageSize,
  chatPageParams,
  type IComponentProps,
  type IComponentPropsExtended,
} from "./interface";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import { Skeleton } from "./Skeleton";

export default function Component(props: IComponentProps) {
  return (
    <Page key={`${props.data.id}/${props.socialModuleProfile.id}`} {...props} />
  );
}

function Page(props: IComponentProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);
  const ru = props.language === "ru";
  const { data, isPending, isPlaceholderData, error, refetch } =
    api.socialModuleProfileFindByIdChatFind({
      id: props.data.id,
      socialModuleProfileId: props.socialModuleProfile.id,
      params: chatPageParams(
        props.includeSubjectProfiles,
        page,
        deferredSearch,
        props.language,
      ),
      reactQueryOptions: {
        placeholderData: (
          previous: IComponentPropsExtended["socialModuleChats"] | undefined,
        ) => previous,
      },
      options: {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    });

  if (isPending) {
    return <Skeleton language={props.language} compact={props.compact} />;
  }

  const status = error && "status" in error ? error.status : undefined;
  if (!data || status === 401 || status === 403) {
    return (
      <div role="alert" className="grid justify-items-start gap-2 p-4 text-sm">
        {ru ? "Не удалось загрузить чаты." : "Could not load chats."}
        <Button variant="outline" onClick={() => void refetch()}>
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    );
  }
  const hasNext = data.length > chatPageSize;
  return (
    <ChildComponent
      {...props}
      search={search}
      onSearch={onSearch}
      socialModuleChats={data.slice(0, chatPageSize)}
      pagination={
        (page > 0 || hasNext) && (
          <nav
            aria-label={ru ? "Страницы чатов" : "Chat pages"}
            className="flex flex-wrap gap-2 p-2"
          >
            <Button
              variant="outline"
              disabled={page === 0 || isPlaceholderData}
              onClick={() => setPage(page - 1)}
            >
              {ru ? "Назад" : "Previous"}
            </Button>
            <Button
              variant="outline"
              disabled={!hasNext || isPlaceholderData}
              onClick={() => setPage(page + 1)}
            >
              {ru ? "Далее" : "Next"}
            </Button>
          </nav>
        )
      }
    />
  );
}
