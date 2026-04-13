import { Component as HostModulePage } from "@sps/host/models/page/frontend/component";
import { Component as RbacSubject } from "../../../../../../rbac/subject";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <HostModulePage
      isServer={props.isServer}
      variant="url-segment-value"
      segment="social.chats.id"
      url={props.url}
    >
      {({ data: socialModuleChatId }) => {
        if (!socialModuleChatId) {
          return;
        }

        return (
          <HostModulePage
            isServer={props.isServer}
            variant="url-segment-value"
            segment="social.threads.id"
            url={props.url}
          >
            {({ data: socialModuleThreadId }) => {
              return (
                <RbacSubject
                  isServer={props.isServer}
                  language={props.language}
                  variant="me-social-module-profile-chat-overview-default"
                  socialModuleChatId={socialModuleChatId}
                  socialModuleThreadId={socialModuleThreadId}
                />
              );
            }}
          </HostModulePage>
        );
      }}
    </HostModulePage>
  );
}
