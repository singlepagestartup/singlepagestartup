import type { IComponentPropsExtended } from "./interface";
import { Component as Profile } from "@sps/social/models/profile/frontend/component";
export function Component(props: IComponentPropsExtended) {
  return (
    <Profile
      isServer={props.isServer}
      variant="author-byline-default"
      profileId={props.data.profileId}
      language={props.language}
      size={props.size}
      inverse={props.inverse}
      className={props.className}
    />
  );
}
