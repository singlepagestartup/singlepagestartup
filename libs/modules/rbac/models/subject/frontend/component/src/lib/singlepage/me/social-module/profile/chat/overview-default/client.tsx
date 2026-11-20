"use client";
import "client-only";
import { ChatNotice } from "../Notice";
import AuthenticationMe from "../../../../../authentication/me-default/client";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps, IComponentPropsExtended } from "./interface";

function GuestChat(props: IComponentPropsExtended) {
  const lookupThread = !props.socialModuleThreadId;
  const threads = api.socialModuleChatFindByIdThreadFind({
    id: props.data.id,
    socialModuleChatId: props.socialModuleChatId,
    reactQueryOptions: { enabled: lookupThread, retry: false },
  });
  const orderThread =
    threads.data?.length === 1 && threads.data[0].hasCustomerWork
      ? threads.data[0].id
      : undefined;
  const threadId = props.socialModuleThreadId ?? orderThread;
  const result = api.customerWorkForThread({
    id: props.data.id,
    threadId: threadId ?? "",
  });
  if (result.data?.chatId === props.socialModuleChatId) {
    return <ChildComponent {...props} />;
  }
  if ((lookupThread && threads.isPending) || (threadId && result.isPending)) {
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
            data={data}
          />
        );
      }}
    </AuthenticationMe>
  );
}
