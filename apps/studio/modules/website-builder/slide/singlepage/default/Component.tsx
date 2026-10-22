import type { IComponentProps, SlideProps } from "./interface";
export const defaultSlideProps: SlideProps = {
  id: "framework-slide-1",
  title: "Build your next idea",
  description:
    "Explore the components, content and interactions behind SinglePageStartup.",
  image:
    "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png",
  imageAlt: "Two people discussing a project",
  actions: [{ id: "explore", label: "Explore components", href: "#products" }],
};
export function Component(props: IComponentProps) {
  const slide = { ...defaultSlideProps, ...props };
  return (
    <article
      data-module="website-builder"
      data-model="slide"
      data-variant="default"
      data-ds-block="website-builder.slide.default"
      data-ds-layer="singlepage"
      className="grid min-w-0 overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-2"
    >
      <div className="flex flex-col justify-center p-6 sm:p-10">
        {slide.title ? (
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {slide.href ? (
              <a
                href={slide.href}
                className="rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                {slide.title}
              </a>
            ) : (
              slide.title
            )}
          </h2>
        ) : slide.href ? (
          <a
            href={slide.href}
            className="w-fit rounded-xl border border-border px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
          >
            Open slide
          </a>
        ) : null}
        {slide.description ? (
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
            {slide.description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {slide.actions?.map((action) => (
            <a
              key={action.id}
              href={action.href}
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {action.label}
            </a>
          ))}
        </div>
        {slide.children}
      </div>
      {slide.image ? (
        <img
          src={slide.image}
          alt={slide.imageAlt}
          className="aspect-square w-full object-cover"
        />
      ) : null}
    </article>
  );
}
