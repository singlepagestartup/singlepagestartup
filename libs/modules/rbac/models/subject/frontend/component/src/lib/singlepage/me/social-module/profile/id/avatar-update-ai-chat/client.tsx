"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const subjectId = props.data.id;
  const profileId = props.profile.id;
  const preview = subjectApi.socialModuleProfileFindByIdAvatarFind({
    options: props.apiProps?.options,
    id: subjectId,
    socialModuleProfileId: profileId,
    reactQueryOptions: { retry: false },
  });
  if (preview.isPending)
    return props.skeleton ?? <Skeleton language={props.language} />;
  return (
    <ChildComponent
      {...props}
      previewRead={{
        data: preview.data,
        isPending: preview.isPending,
        isFetching: preview.isFetching,
        isError: preview.isError,
        error: preview.error ? { message: preview.error.message } : undefined,
        refetch: () => {
          void preview.refetch();
        },
      }}
    />
  );
}
