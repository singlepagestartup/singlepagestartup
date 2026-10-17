"use client";
import type { IComponentProps, IKnowledgeUpdateProps } from "./interface";
export type { IKnowledgeUpdateProps } from "./interface";

import { useRef, useEffect } from "react";
import { useStudioAccount } from "../../../../../../../../../../../account/Account";
import { useThread } from "../../../../../../../../../../../../../../../social/thread/singlepage/id/ai-chat/Thread";
import { useSource } from "../../../../../../../../../../../../../../../knowledge/source/singlepage/id/ai-chat/Source";

export function Component({
  variant = "me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-update-ai-chat",
  subjectId,
  profileId,
  chatId,
  threadId,
}: IComponentProps) {
  const { account } = useStudioAccount();
  const { thread, pane, proposal, apply, dismiss, error } = useThread();
  const { source } = useSource();
  const view = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pane === "chat" && proposal)
      view.current?.scrollIntoView({ block: "nearest" });
  }, [pane, proposal]);
  return (
    <div
      ref={view}
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
      data-subject-id={subjectId ?? account.subject?.id}
      data-profile-id={profileId}
      data-chat-id={chatId}
      data-thread-id={threadId}
    >
      {thread.id === threadId && proposal && (
        <div className="mx-4 mb-4 rounded-xl border border-border bg-muted p-4">
          <p className="text-xs font-semibold">
            Proposed update · {source.title}
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
            {proposal.text}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={apply}>Apply to knowledge</Button>
            <Button appearance="plain" onClick={dismiss}>
              Dismiss
            </Button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
interface IButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  appearance?: "primary" | "plain";
}
function Button({
  appearance = "primary",
  type = "button",
  ...props
}: IButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold focus-visible:outline-2 ${appearance === "primary" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
    />
  );
}
