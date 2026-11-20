import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <Subject
      isServer={props.isServer}
      variant="social-module-profile-find"
      skeleton={props.skeleton}
      data={props.data}
      language={props.language}
      apiProps={{ params: { socialModuleChatId: props.socialModuleChatId } }}
    >
      {({ data: profiles }) => {
        const profile =
          profiles.find((profile) => profile.variant === "default") ||
          profiles[0];
        return profile ? (
          <Subject
            isServer={props.isServer}
            variant="social-module-profile-chat-overview-default"
            data={props.data}
            language={props.language}
            socialModuleProfile={profile}
            socialModuleChatId={props.socialModuleChatId}
            socialModuleThreadId={props.socialModuleThreadId}
          />
        ) : (
          <p role="status">
            {props.language === "ru" ? "Чат недоступен." : "Chat unavailable."}
          </p>
        );
      }}
    </Subject>
  );
}
