import type { IComponentProps } from "./interface";
import Markdown from "markdown-to-jsx";
import type { ReactNode } from "react";
import type { IAIChatSource } from "../../../../social/profile/singlepage/scope/ai-chat/project/models";

export function Component({
  variant = "id-sidebar-ai-chat",
  data,
  children,
}: IComponentProps) {
  return (
    <details
      data-module="knowledge"
      data-model="source"
      data-variant={variant}
      data-id={data.id}
      className="rounded-xl border border-border bg-card p-4"
    >
      <summary className="min-h-8 cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
        {data.title}
      </summary>
      <div className="prose prose-sm mt-3 max-w-none break-words text-muted-foreground">
        <Markdown options={{ disableParsingRawHTML: true }}>
          {data.content || "Содержимое документа пока не добавлено."}
        </Markdown>
      </div>
      {children}
    </details>
  );
}
