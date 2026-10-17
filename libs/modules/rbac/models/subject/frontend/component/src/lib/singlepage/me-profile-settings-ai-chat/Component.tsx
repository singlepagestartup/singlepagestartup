import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <Subject
      isServer={props.isServer}
      variant="me-social-module-profile-list-settings-ai-chat"
      data={props.data}
    />
  );
}
