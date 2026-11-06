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
        "w-full px-4 py-8 sm:px-6 sm:py-12",
        props.data.className,
        props.className,
      )}
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        {title || description ? (
          <header className="space-y-3">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
            ) : null}
            {description ? (
              <div className="text-sm leading-6 text-muted-foreground">
                <TipTap value={description} />
              </div>
            ) : null}
          </header>
        ) : null}
        {props.children}
      </div>
    </section>
  );
}
