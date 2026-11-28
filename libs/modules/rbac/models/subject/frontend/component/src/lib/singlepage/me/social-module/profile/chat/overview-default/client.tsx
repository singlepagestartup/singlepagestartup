"use client";
import "client-only";
import { ChatNotice } from "../Notice";
import AuthenticationMe from "../../../../../authentication/me-default/client";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { SUPPORT_THREAD_VARIANT } from "@sps/social/models/thread/sdk/model";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps, IComponentPropsExtended } from "./interface";

function GuestChat(props: IComponentPropsExtended) {
  const threads = api.socialModuleChatFindByIdThreadFind({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChatId,
    params: { threadId: props.socialModuleThreadId },
    reactQueryOptions: { retry: false },
  });
  if (
    !threads.error &&
    threads.data?.some(
      ({ hasCustomerWork, variant }) =>
        hasCustomerWork || variant === SUPPORT_THREAD_VARIANT,
    )
  ) {
    return <ChildComponent {...props} />;
  }
  if (threads.isPending) {
    return props.skeleton;
  }
  return <ChatNotice language={props.language} />;
}

export default function Client(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      waitForAuthenticationInit
      fallback={<ChatNotice language={props.language} sessionError />}
    >
      {({ data, authenticated }) => {
        if (!data) return <ChatNotice language={props.language} sessionError />;
        const Chat = authenticated ? ChildComponent : GuestChat;
        return (
          <Chat
            isServer={false}
            variant={props.variant}
            language={props.language}
            skeleton={props.skeleton}
            socialModuleChatId={props.socialModuleChatId}
            socialModuleThreadId={props.socialModuleThreadId}
            defaultThreadId={props.defaultThreadId}
            getThreadHref={props.getThreadHref}
            data={data}
          />
        );
      }}
    </AuthenticationMe>
  );
}
