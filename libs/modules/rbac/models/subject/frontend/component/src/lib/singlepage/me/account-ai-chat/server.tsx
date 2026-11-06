"use server";
import "server-only";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  const options = {
    ...props.apiProps?.options,
    next: { ...props.apiProps?.options?.next, revalidate: 0 },
  };
  const [profiles, identities, balance] = await Promise.all([
    subjectApi
      .socialModuleProfileFind({
        id: props.data.id,
        params: {
          filters: {
            and: [{ column: "variant", method: "eq", value: "default" }],
          },
        },
        options,
      })
      .catch(() => undefined),
    subjectApi
      .identityFind({ id: props.data.id, options })
      .catch(() => undefined),
    subjectApi
      .billingModuleBalance({ id: props.data.id, options })
      .catch(() => undefined),
  ]);
  const profile = profiles?.[0];
  const avatar = profile
    ? await subjectApi
        .socialModuleProfileFindByIdAvatarFind({
          id: props.data.id,
          socialModuleProfileId: profile.id,
          options,
        })
        .catch(() => undefined)
    : undefined;
  return (
    <ChildComponent
      {...props}
      accountProfile={profile}
      accountIdentities={identities}
      accountAvatar={avatar}
      accountBalance={balance}
    />
  );
}
