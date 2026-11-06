import { Component as Profile } from "@sps/social/models/profile/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  if (!props.profileId) return null;
  return (
    <Profile
      isServer={props.isServer}
      variant="author-overview-default"
      profileId={props.profileId}
      language={props.language}
    />
  );
}
