import { memo } from "react";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo<IComponentPropsExtended>(
  function Component(props) {
    const title = props.data.title?.[props.language] || props.data.title?.en;
    const description =
      props.data.description?.[props.language] || props.data.description?.en;
    return (
      <details
        data-module="website-builder"
        data-model="feature"
        data-id={props.data.id}
        data-variant={props.variant}
        className={cn(
          "group w-full min-w-0 border-b border-border px-3 py-3 last:border-b-0",
          props.data.className,
          props.className,
        )}
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md text-sm font-semibold leading-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
          <span>{title}</span>
          <Icon
            name="plus"
            size={20}
            className="mt-0.5 shrink-0 group-open:rotate-45 motion-safe:transition-transform"
          />
        </summary>
        {description ? (
          <div className="mt-3 pb-2 pr-8 text-sm leading-6 text-muted-foreground [&_.prose]:text-muted-foreground">
            <TipTap value={description} />
          </div>
        ) : null}
        {props.children}
      </details>
    );
  },
);
