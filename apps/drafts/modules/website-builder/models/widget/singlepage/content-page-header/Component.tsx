export const defaultContentPageHeaderProps = {
  eyebrow: "Services",
  title: "What We Build",
  description:
    "End-to-end digital services — from website development and SaaS products to consulting, audits, and team training.",
};

export type ContentPageHeaderProps = typeof defaultContentPageHeaderProps;

export function ContentPageHeader(props?: Partial<ContentPageHeaderProps>) {
  const { eyebrow, title, description } = {
    ...defaultContentPageHeaderProps,
    ...props,
  };

  return (
    <section
      className="border-b border-slate-200 bg-white py-12"
      data-ds-block="website-builder.widget.content-page-header"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
          {eyebrow}
        </p>
        <h1 className="text-3xl tracking-tight text-slate-900 lg:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-slate-600">{description}</p>
      </div>
    </section>
  );
}
