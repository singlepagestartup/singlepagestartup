import type { IComponentProps, IThreadCreateProps } from "./interface";
export type { IThreadCreateProps } from "./interface";
import type { ReactNode } from "react";

export function Component({
  variant = "create-ai-chat",
  chatId,
  navigation,
  children,
}: IComponentProps) {
  return (
    <section
      data-ds-block="social.thread.create-ai-chat"
      data-module="social"
      data-model="thread"
      data-variant={variant}
      data-chat-id={chatId}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border bg-card p-4">
        {navigation}
        <div>
          <p className="text-xs text-muted-foreground">Thread</p>
          <h2 className="mt-1 text-base font-semibold">Новое обсуждение</h2>
        </div>
      </header>
      {children}
    </section>
  );
}
