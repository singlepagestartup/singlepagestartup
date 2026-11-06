import type { IComponentProps, ContentPageHeaderProps } from "./interface";
export type { ContentPageHeaderProps } from "./interface";
export const defaultContentPageHeaderProps = {
  eyebrow: "Services",
  title: "What we build",
  description:
    "End-to-end digital services — from website development and SaaS products to consulting, audits, and team training.",
};

export function ContentPageHeader(props?: IComponentProps) {
  const {
    eyebrow,
    title,
    description,
    compact = false,
  } = {
    ...defaultContentPageHeaderProps,
    ...props,
  };

  return (
    <section
      className={`bg-muted ${compact ? "pb-6 pt-8 sm:pb-8 sm:pt-12" : "py-10 sm:py-16"}`}
      data-ds-block="website-builder.widget.content-page-header"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-page-header"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm font-semibold tracking-normal text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl text-[2.5rem] font-semibold leading-[1.1] tracking-normal text-foreground sm:text-5xl lg:text-[4rem]">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {description}
        </p>
      </div>
    </section>
  );
}
