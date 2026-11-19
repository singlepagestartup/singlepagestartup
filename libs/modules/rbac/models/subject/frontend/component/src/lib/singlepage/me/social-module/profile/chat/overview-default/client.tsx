"use client";
import "client-only";
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
  const ru = props.language === "ru";
  if (result.data?.chatId === props.socialModuleChatId) {
    return <ChildComponent {...props} />;
  }
  if ((lookupThread && threads.isPending) || (threadId && result.isPending)) {
    return (
      <p role="status">
        {ru ? "Загружаем переписку…" : "Loading conversation…"}
      </p>
    );
  }
  return (
    <p role="status">
      {ru ? "Войдите, чтобы открыть чаты." : "Sign in to view chats."}
    </p>
  );
}

export default function Client(props: IComponentProps) {
  const signIn = (
    <p role="status">
      {props.language === "ru"
        ? "Войдите, чтобы открыть чаты."
        : "Sign in to view chats."}
    </p>
  );
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={signIn}
    >
      {({ data, authenticated }) => {
        if (!data) return signIn;
        const Chat = authenticated ? ChildComponent : GuestChat;
        return (
          <Chat
            isServer={false}
            variant={props.variant}
            language={props.language}
            socialModuleChatId={props.socialModuleChatId}
            socialModuleThreadId={props.socialModuleThreadId}
            data={data}
          />
        );
      }}
    </AuthenticationMe>
  );
}
