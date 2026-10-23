import { TipTap } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const title = props.data.title?.[props.language] || props.data.title?.en;
  const description =
    props.data.description?.[props.language] || props.data.description?.en;
  return (
    <section
      id={props.data.anchor || undefined}
      data-module="website-builder"
      data-model="widget"
      data-id={props.data.id}
      data-variant={props.variant}
      className={cn(
        "mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:px-6",
        props.className,
      )}
    >
      {title || description ? (
        <header className="space-y-3">
          {title ? (
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          ) : null}
          {description ? (
            <div className="text-sm leading-6 text-muted-foreground">
              <TipTap value={description} />
            </div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("grid gap-5", props.data.className)}>
        {props.children}
      </div>
      {props.footer}
    </section>
  );
}
