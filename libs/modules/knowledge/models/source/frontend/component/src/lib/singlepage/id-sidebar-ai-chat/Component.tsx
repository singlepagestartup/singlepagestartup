import { memo } from "react";
import Markdown from "markdown-to-jsx";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  return (
    <details
      data-module="knowledge"
      data-model="source"
      data-variant={props.variant}
      data-id={props.data.id}
      className="rounded-xl border border-border bg-card p-4"
    >
      <summary className="min-h-8 cursor-pointer text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2">
        {props.data.title}
      </summary>
      <div className="prose prose-sm mt-3 max-w-none break-words text-muted-foreground">
        <Markdown options={{ disableParsingRawHTML: true }}>
          {props.data.content || "No knowledge content provided."}
        </Markdown>
      </div>
      {props.children}
    </details>
  );
});
