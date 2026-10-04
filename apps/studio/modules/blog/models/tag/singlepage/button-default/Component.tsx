/**
 * blog.tag.button-default
 *
 * Single article tag button. Owned by the blog module (model: tag). Tag-list
 * widgets compose a list of these instead of re-implementing the chip markup.
 */

export interface TagButtonDefaultProps {
  label: string;
  href?: string;
}

export const defaultTagButtonDefaultProps: TagButtonDefaultProps = {
  label: "pricing",
  href: "/blog/tags/pricing",
};

export function TagButtonDefault(props?: Partial<TagButtonDefaultProps>) {
  const { label, href } = { ...defaultTagButtonDefaultProps, ...props };

  return (
    <a
      href={href}
      data-ds-block="blog.tag.button-default"
      data-ds-layer="singlepage"
      className="inline-flex min-h-11 items-center rounded-full border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-background)] px-3 py-2 text-xs font-medium text-[var(--workspace-brand-muted)] no-underline transition hover:border-[var(--workspace-brand-line)] hover:bg-[var(--workspace-brand-surface)] hover:text-[var(--workspace-brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
    >
      #{label}
    </a>
  );
}
