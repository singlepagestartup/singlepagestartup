import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <RbacModuleSubject
      isServer={false}
      variant="me-navigation-controls-ai-chat"
      language={props.language}
      settingsSelected={props.url === "/rbac/subjects/settings"}
    />
  );
}
