"use client";
import "client-only";
import AuthenticationMe from "../../../../../authentication/me-default/client";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { CustomerWorkView } from "../../../../../social-module/profile/chat/message/list/default/components/CustomerWork";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps, IComponentPropsExtended } from "./interface";

function SessionChat(
  props: IComponentPropsExtended & { authenticated: boolean },
) {
  const result = api.customerWorkForThread({
    id: props.data.id,
    threadId: props.socialModuleThreadId ?? "",
  });
  const ru = props.language === "ru";
  if (result.data?.chatId === props.socialModuleChatId) {
    return (
      <CustomerWorkView
        subjectId={props.data.id}
        work={result.data}
        language={props.language}
      />
    );
  }
  if (props.socialModuleThreadId && result.isPending) {
    return (
      <p role="status">
        {ru ? "Загружаем переписку…" : "Loading conversation…"}
      </p>
    );
  }
  if (!props.authenticated) {
    return <p role="status">Sign in to view chats.</p>;
  }
  return <ChildComponent {...props} />;
}

export default function Client(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      apiProps={props.apiProps}
      skeleton={props.skeleton}
      fallback={<p role="status">Sign in to view chats.</p>}
    >
      {({ data, authenticated }) =>
        data ? (
          <SessionChat
            {...props}
            isServer={false}
            data={data}
            authenticated={authenticated}
          />
        ) : (
          <p role="status">Sign in to view chats.</p>
        )
      }
    </AuthenticationMe>
  );
}
