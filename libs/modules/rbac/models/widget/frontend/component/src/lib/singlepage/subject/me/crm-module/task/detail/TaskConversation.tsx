"use client";

import { WorkspaceOrderFileContext } from "@sps/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/CustomerWorkResult";
import { useEffect, useRef, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@sps/shared-ui-shadcn";
import { Component as Subject } from "@sps/rbac/models/subject/frontend/component";
import { api } from "@sps/rbac/models/subject/sdk/client";
import type { ICrmWorkspaceTaskDetail } from "@sps/rbac/models/subject/sdk/model";

interface IProps {
  subjectId: string;
  storeId: string;
  taskId: string;
  language: string;
  thread?: ICrmWorkspaceTaskDetail["thread"];
  discussionOnly: boolean;
}

export function TaskConversation({
  subjectId,
  storeId,
  taskId,
  language,
  thread,
  discussionOnly,
}: IProps) {
  const pathname = usePathname();
  const params = useSearchParams();
  const join = api.crmWorkspace.useCommand(subjectId);
  const requested = useRef(false);
  const { mutate } = join;
  const member = Boolean(thread?.actorProfileId);
  useEffect(() => {
    if (member || requested.current) return;
    requested.current = true;
    mutate({ kind: "join-task-chat", task: { storeId, taskId } });
  }, [member, storeId, taskId, mutate]);
  const joined =
    join.data?.kind === "join-task-chat" ? join.data.data : undefined;
  const chatId = member ? thread?.chatId : joined?.chatId;
  const defaultThreadId = member ? thread?.id : joined?.threadId;
  const ru = language === "ru";
  const supportThreadId = thread?.supportThreadId;
  const scope = useMemo(
    () =>
      chatId
        ? { storeId, taskId, chatId, discussionOnly, supportThreadId }
        : null,
    [storeId, taskId, chatId, discussionOnly, supportThreadId],
  );
  if (!chatId || !defaultThreadId) {
    return join.isError ? (
      <div role="alert">
        {ru
          ? "Не удалось открыть чат задачи."
          : "Could not open the task chat."}{" "}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            mutate({ kind: "join-task-chat", task: { storeId, taskId } })
          }
        >
          {ru ? "Повторить" : "Retry"}
        </Button>
      </div>
    ) : (
      <p role="status">{ru ? "Открываем чат…" : "Opening chat…"}</p>
    );
  }
  return (
    <WorkspaceOrderFileContext.Provider value={scope}>
      <Subject
        isServer={false}
        variant="me-social-module-profile-chat-overview-default"
        language={language}
        socialModuleChatId={chatId}
        socialModuleThreadId={params?.get("thread") || defaultThreadId}
        defaultThreadId={defaultThreadId}
        getThreadHref={(threadId) => {
          const next = new URLSearchParams(params?.toString());
          next.set("thread", threadId);
          return `${pathname}?${next}`;
        }}
      />
    </WorkspaceOrderFileContext.Provider>
  );
}
