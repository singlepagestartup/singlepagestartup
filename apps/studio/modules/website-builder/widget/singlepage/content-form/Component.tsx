import type { IComponentProps } from "./interface";
export function Component(props: IComponentProps) {
  return (
    <section
      data-module="website-builder"
      data-model="widget"
      data-variant="content-form"
      className="w-full px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        {props.title || props.description ? (
          <header className="space-y-3">
            {props.title ? (
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
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
        {props.children}
      </div>
    </section>
  );
}
