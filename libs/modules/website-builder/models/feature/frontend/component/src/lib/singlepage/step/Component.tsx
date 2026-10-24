import { memo } from "react";
import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";
export const Component = memo<IComponentPropsExtended>(
  function Component(props) {
    const title = props.data.title?.[props.language] || props.data.title?.en;
    const subtitle =
      props.data.subtitle?.[props.language] || props.data.subtitle?.en;
    const description =
      props.data.description?.[props.language] || props.data.description?.en;
    return (
      <div
        data-module="website-builder"
        data-model="feature"
        data-id={props.data.id}
        data-variant={props.variant}
        className={cn(
          "min-w-0 w-full border-t border-default-foreground/20 pt-5",
          props.data.className,
          props.className,
        )}
      >
        {subtitle ? (
          <p className="text-sm font-medium text-primary">{subtitle}</p>
        ) : null}
        {title ? (
          <h3 className="mt-3 text-base font-semibold">{title}</h3>
        ) : null}
        {description ? (
          <div className="mt-2 text-sm leading-6 text-default-muted-foreground [&_.prose]:text-default-muted-foreground">
            <TipTap value={description} />
          </div>
        ) : null}
        {props.children}
      </div>
    );
  },
);
