import { twMerge } from "tailwind-merge";
import type { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <section
      data-module="website-builder"
      data-model="widget"
      data-variant="content-collection"
      className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:px-6"
    >
      {props.title || props.description ? (
        <header className="space-y-3">
          {props.title ? (
            <h1 className="text-3xl font-semibold tracking-tight">
              {props.title}
            </h1>
          ) : null}
          {props.description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {props.description}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className={twMerge("grid gap-5", props.className)}>
        {props.children}
      </div>
      {props.footer}
    </section>
  );
}
