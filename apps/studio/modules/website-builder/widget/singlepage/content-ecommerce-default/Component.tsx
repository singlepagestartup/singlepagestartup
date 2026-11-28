import type { IComponentProps } from "./interface";
export function Component({ title, children }: IComponentProps) {
  return (
    <section
      data-module="website-builder"
      data-model="widget"
      data-variant="content-ecommerce-default"
      className="mx-auto w-full min-w-0 max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      <div className="min-w-0 w-full">{children}</div>
    </section>
  );
}
