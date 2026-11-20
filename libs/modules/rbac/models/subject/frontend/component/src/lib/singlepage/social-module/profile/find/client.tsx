"use client";
import "client-only";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Button } from "@sps/shared-ui-shadcn";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  const { data, error, isLoading, refetch } = api.socialModuleProfileFind({
    id: props.data.id,
    ...props.apiProps,
  });
  if (error) {
    const ru = props.language === "ru";
    return (
      <div role="alert">
        {ru ? "Не удалось загрузить профили." : "Could not load profiles."}
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    );
  }
  if (isLoading)
    return (
      props.skeleton ?? (
        <p role="status">
          {props.language === "ru" ? "Загружаем профили…" : "Loading profiles…"}
        </p>
      )
    );
  return data ? props.children({ data }) : null;
}
