import { internationalization } from "@sps/shared-configuration";
import { TipTap } from "@sps/shared-ui-shadcn";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  return (
    <details
      id={props.id || props.data.anchor || undefined}
      open={props.open}
      className="my-5 text-xs leading-6 text-muted-foreground"
      data-module="website-builder"
      data-model="widget"
      data-variant={props.variant}
      data-id={props.data.id}
    >
      <summary className="min-h-9 cursor-pointer underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        {props.data.title?.[language] || props.data.title?.en}
      </summary>
      <div className="prose prose-sm mt-3 max-w-none break-words rounded-2xl border border-border bg-card p-5 text-muted-foreground prose-headings:text-foreground">
        <TipTap
          value={
            props.data.description?.[language] ||
            props.data.description?.en ||
            ""
          }
        />
      </div>
    </details>
  );
}
