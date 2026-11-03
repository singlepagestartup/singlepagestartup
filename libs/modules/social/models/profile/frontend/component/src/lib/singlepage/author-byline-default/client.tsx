"use client";
import { api as profileApi } from "@sps/social/models/profile/sdk/client";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";
import { Skeleton } from "./Skeleton";
export default function Client(props: IComponentProps) {
  const query = profileApi.authorFind({
    params: { profileId: props.profileId },
    options: props.apiProps?.options,
    reactQueryOptions: { enabled: !!props.profileId },
  });
  if (!props.profileId) return null;
  if (query.isPending) return props.skeleton ?? <Skeleton />;
  const data = query.data?.[0];
  if (query.isError && !data)
    return (
      <div role="alert" className="space-y-2 text-sm">
        <p>
          {props.language === "ru"
            ? "Не удалось загрузить автора."
            : "Unable to load the author."}
        </p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="min-h-11 rounded-xl border border-border px-4"
        >
          {props.language === "ru" ? "Повторить" : "Retry"}
        </button>
      </div>
    );
  if (!data) return null;
  return <ChildComponent {...props} data={data} />;
}
