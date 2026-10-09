export interface ButtonLinkProps {
  label: string;
  href: string;
  size?: "sm" | "xs";
  tone?: "default" | "muted";
  target?: "_self" | "_top";
}

export const defaultButtonLinkProps: ButtonLinkProps = {
  label: "Privacy",
  href: "/privacy",
  size: "sm",
  tone: "default",
};

export function ButtonLink(props?: Partial<ButtonLinkProps>) {
  const label = props?.label ?? defaultButtonLinkProps.label;
  const href = props?.href ?? defaultButtonLinkProps.href;
  const size = props?.size ?? defaultButtonLinkProps.size;
  const tone = props?.tone ?? defaultButtonLinkProps.tone;
  const sizeClass = size === "xs" ? "text-xs" : "text-sm";
  const toneClass =
    tone === "muted"
      ? "text-[var(--workspace-brand-muted)] hover:text-[var(--workspace-brand-foreground)]"
      : "text-[var(--workspace-brand-muted)] hover:text-[var(--workspace-brand-foreground)]";

  return (
    <a
      className={`inline-flex min-h-11 min-w-11 max-w-full items-center justify-center rounded-xl no-underline underline-offset-4 transition hover:underline motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] ${sizeClass} ${toneClass}`}
      data-ds-block="website-builder.button.link"
      data-ds-layer="singlepage"
      href={href}
      target={props?.target}
    >
      {label}
    </a>
  );
}
