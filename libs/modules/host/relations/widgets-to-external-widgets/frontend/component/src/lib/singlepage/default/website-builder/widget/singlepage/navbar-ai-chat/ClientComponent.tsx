"use client";

import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { Component as Page } from "@sps/host/models/page/frontend/component";
import { Icon } from "@sps/ui-adapter";

interface IComponentProps {
  language: string;
  url: string;
}

export function Component(props: IComponentProps) {
  const signIn = (
    <a
      href={`/${props.language || "en"}/ai-chat/sign-in`}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
        <Icon name="user-circle" size={24} className="size-6" />
      </span>
      Sign in
    </a>
  );

  return (
    <Subject
      isServer={false}
      variant="authentication-me-default"
      fallback={signIn}
      skeleton={signIn}
    >
      {({ data, authenticated }) => {
        if (!data || !authenticated) return signIn;
        return (
          <Page
            isServer={false}
            variant="url-segment-value"
            url={props.url}
            segment="social.profiles.id"
          >
            {({ data: profileId }) => (
              <Page
                isServer={false}
                variant="url-segment-value"
                url={props.url}
                segment="social.chats.id"
              >
                {({ data: chatId }) => (
                  <>
                    <Subject
                      isServer={false}
                      variant="me-social-module-profile-select-ai-chat"
                      data={data}
                      profileId={profileId}
                      chatId={chatId}
                      language={props.language}
                    />
                    <Subject
                      isServer={false}
                      variant="me-account-ai-chat"
                      data={data}
                      language={props.language}
                      settingsSelected={props.url === "/ai-chat/settings"}
                    />
                  </>
                )}
              </Page>
            )}
          </Page>
        );
      }}
    </Subject>
  );
}
