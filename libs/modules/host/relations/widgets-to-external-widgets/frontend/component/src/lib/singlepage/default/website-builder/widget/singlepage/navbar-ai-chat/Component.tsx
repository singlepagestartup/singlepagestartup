import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as RbacModuleSubject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-values"
      url={props.url}
    >
      {({ data: routeParams }) => (
        <RbacModuleSubject
          isServer={props.isServer}
          variant="me-navigation-controls-ai-chat"
          language={props.language}
          socialModuleProfileId={routeParams?.["social.profiles.id"]}
          socialModuleChatId={routeParams?.["social.chats.id"]}
          settingsSelected={props.url === "/ai-chat/settings"}
        />
      )}
    </Page>
  );
}
