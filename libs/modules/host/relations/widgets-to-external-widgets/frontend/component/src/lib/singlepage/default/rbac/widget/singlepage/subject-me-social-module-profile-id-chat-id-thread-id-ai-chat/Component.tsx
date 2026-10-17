import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Component as SubjectWidget } from "@sps/rbac/models/widget/frontend/component";
import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <Page
      isServer={props.isServer}
      variant="url-segment-value"
      url={props.url}
      segment="social.profiles.id"
    >
      {({ data: profileId }) => (
        <Page
          isServer={props.isServer}
          variant="url-segment-value"
          url={props.url}
          segment="social.chats.id"
        >
          {({ data: chatId }) => (
            <Page
              isServer={props.isServer}
              variant="url-segment-value"
              url={props.url}
              segment="social.threads.id"
            >
              {({ data: threadId }) => (
                <SubjectWidget
                  isServer={props.isServer}
                  data={props.data}
                  variant={props.variant}
                  language={props.language}
                  profileId={profileId}
                  chatId={chatId}
                  threadId={threadId}
                />
              )}
            </Page>
          )}
        </Page>
      )}
    </Page>
  );
}
