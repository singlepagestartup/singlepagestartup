import { twMerge } from "tailwind-merge";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  const Heading = props.headingLevel ?? "h2";
  return (
    <section
      id={props.id}
      tabIndex={props.id ? -1 : undefined}
      aria-labelledby={
        props.id && props.title ? `${props.id}-title` : undefined
      }
      data-module="website-builder"
      data-model="widget"
      data-variant="content-collection"
      className={`mx-auto w-full min-w-0 max-w-7xl outline-none ${props.spacing === "page" ? "space-y-8 px-5 py-12 @3xl:px-8 @3xl:py-16" : "space-y-6 px-4 py-8 sm:px-6"}`}
    >
      {props.title || props.description ? (
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="space-y-3">
            {props.eyebrow ? (
              <p className="text-sm text-muted-foreground">{props.eyebrow}</p>
            ) : null}
            {props.title ? (
              <Heading
                id={props.id ? `${props.id}-title` : undefined}
                className="max-w-3xl text-balance font-default text-3xl font-semibold leading-tight tracking-normal @4xl:text-4xl"
              >
                {props.title}
              </Heading>
            ) : null}
            {props.description ? (
              <div className="max-w-2xl text-base leading-7 text-muted-foreground">
                {props.description}
              </div>
            ) : null}
          </div>
          {props.actions}
        </header>
      ) : null}
      <div className={twMerge("grid gap-5", props.className)}>
        {props.children}
      </div>
      {props.footer}
    </section>
  );
}
