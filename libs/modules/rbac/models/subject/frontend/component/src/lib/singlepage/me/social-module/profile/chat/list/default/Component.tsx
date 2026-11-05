import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <Subject
      isServer={props.isServer}
      variant="social-module-profile-find"
      data={props.data}
      language={props.language}
    >
      {({ data: profiles }) => {
        const profile =
          profiles.find((profile) => profile.variant === "default") ||
          profiles[0];
        return profile ? (
          <Subject
            isServer={props.isServer}
            variant="social-module-profile-chat-list-default"
            data={props.data}
            language={props.language}
            socialModuleProfile={profile}
            includeSubjectProfiles={true}
            currentSocialModuleChatId={props.socialModuleChatId}
          />
        ) : (
          <p role="status">No chats yet.</p>
        );
      }}
    </Subject>
  );
}
