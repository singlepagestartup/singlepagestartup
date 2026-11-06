"use client";
import { Skeleton } from "./Skeleton";
import "client-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const profiles = subjectApi.socialModuleProfileFind({
    options: props.apiProps?.options,
    id: props.data.id,
    params: {
      filters: { and: [{ column: "variant", method: "eq", value: "default" }] },
    },
    reactQueryOptions: { retry: false },
  });
  const identities = subjectApi.identityFind({
    options: props.apiProps?.options
      ? { ...props.apiProps.options, next: { ...props.apiProps.options.next } }
      : undefined,

    id: props.data.id,
    reactQueryOptions: { retry: false },
  });
  const balance = subjectApi.billingModuleBalance({
    options: props.apiProps?.options,
    id: props.data.id,
  });
  const profile = profiles.data?.[0];
  const avatar = subjectApi.socialModuleProfileFindByIdAvatarFind({
    options: props.apiProps?.options,
    id: props.data.id,
    socialModuleProfileId: profile?.id || "",
    reactQueryOptions: { retry: false, enabled: !!profile },
  });
  if (
    profiles.isPending ||
    identities.isPending ||
    balance.isPending ||
    (!!profile && avatar.isPending)
  )
    return props.skeleton ?? <Skeleton language={props.language} />;
  return (
    <ChildComponent
      {...props}
      accountProfile={profile}
      accountIdentities={identities.data}
      accountAvatar={avatar.data}
      accountBalance={balance.data}
    />
  );
}
