"use client";
import { internationalization } from "@sps/shared-configuration";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { AI_CHAT_DOCUMENTS } from "@sps/shared-utils";
import { Component as SocialModuleMessage } from "@sps/social/models/message/frontend/component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const messages = {
    ...props.messagesRead,
    refetch: props.messagesRead.refetch || (() => window.location.reload()),
  };
  if (messages.error && !messages.data)
    return (
      <p role="alert" className="p-4 text-destructive">
        {messages.error.message}
      </p>
    );
  const ordered = [...(messages.data || [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const document = getAIChatDocument(props.thread.metadata);
  const definition =
    document?.profileId === props.project.profile.id
      ? AI_CHAT_DOCUMENTS.find((item) => item.key === document.key)
      : undefined;
  return (
    <SocialModuleMessage
      isServer={false}
      language={language}
      variant="list-ai-chat"
      threadId={props.thread.id}
      keepDataWhileFetching
      dataSource="props"
      data={ordered}
      documentTitle={
        definition ? props.thread.title || definition.title : undefined
      }
      emptyMessage={
        definition?.prompt ||
        (ru
          ? "Начните разговор о своём проекте. Помощник может использовать сохранённые знания и прикреплённые материалы."
          : "Start a conversation about your project. The assistant can use its saved knowledge and attached materials.")
      }
      requesterProfileId={props.project.requesterProfileId}
      assistantProfileId={props.project.profile.id}
      onProfileOpen={props.onProfileOpen}
    />
  );
}
