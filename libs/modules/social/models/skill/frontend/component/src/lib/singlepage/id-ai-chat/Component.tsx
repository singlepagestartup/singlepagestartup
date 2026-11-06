import { memo } from "react";
import Markdown from "markdown-to-jsx";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const title = props.data.title || props.data.adminTitle;
  const content = props.data.description || "";
  return (
    <article
      data-module="social"
      data-model="skill"
      data-variant={props.variant}
      data-id={props.data.id}
      className="rounded-xl border border-border p-4"
    >
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <div className="prose prose-sm max-w-none break-words text-muted-foreground">
        <Markdown options={{ disableParsingRawHTML: true }}>{content}</Markdown>
      </div>
    </article>
  );
});
