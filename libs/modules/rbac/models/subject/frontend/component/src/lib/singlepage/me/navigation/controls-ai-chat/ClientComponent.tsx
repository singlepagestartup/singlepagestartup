"use client";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import type { IComponentProps } from "./interface";
import { Icon } from "@sps/ui-adapter";
import { internationalization } from "@sps/shared-configuration";
export function Component(props: IComponentProps) {
  const language = props.language || internationalization.defaultLanguage.code;
  const profileId = props.socialModuleProfileId;
  const chatId = props.socialModuleChatId;
  const signIn = (
    <a
      href={`/${language}/ai-chat/sign-in`}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted">
        <Icon name="user-circle" size={24} className="size-6" />
      </span>
      {language === "ru" ? "Войти" : "Sign in"}
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
          <>
            <Subject
              isServer={false}
              variant="me-social-module-profile-select-ai-chat"
              data={data}
              socialModuleProfileId={profileId}
              socialModuleChatId={chatId}
              language={language}
            />
            <Subject
              isServer={false}
              variant="me-account-ai-chat"
              data={data}
              language={language}
              settingsSelected={props.settingsSelected}
            />
          </>
        );
      }}
    </Subject>
  );
}
