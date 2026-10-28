import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
import { memo } from "react";
import { Icon } from "@sps/ui-adapter";
export const Component = memo<IComponentPropsExtended>(
  function Component(props) {
    const { data, language, isServer } = props;
    const title = data.title?.[language] || data.title?.en;
    const subtitle = data.subtitle?.[language] || data.subtitle?.en;
    const description = data.description?.[language] || data.description?.en;
    return (
      <details
        data-module="website-builder"
        data-model="feature"
        data-id={data.id}
        data-variant={props.variant}
        className={cn(
          "group mb-3 w-full min-w-0 rounded-2xl border border-border bg-card open:border-primary/50 open:bg-primary/10",
          data.className,
          props.className,
        )}
      >
        <summary className="flex min-h-[76px] cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-4 text-sm font-semibold leading-6 hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-details-marker]:hidden">
          <span>{title}</span>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground group-open:bg-default group-open:text-primary">
            <Icon name="plus" size={20} className="group-open:hidden" />
            <Icon name="minus" size={20} className="hidden group-open:block" />
          </span>
        </summary>
        <div className="px-4 pb-5 text-sm leading-7 text-muted-foreground">
          <TipTap value={description ?? ""} />
        </div>
        {props.children}
      </details>
    );
  },
);
