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
      className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 no-underline transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
    >
      #{label}
    </a>
  );
}
