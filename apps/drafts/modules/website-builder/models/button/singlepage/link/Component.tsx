export interface ButtonLinkProps {
  label: string;
  href: string;
  size?: "sm" | "xs";
  tone?: "default" | "muted";
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
      ? "text-slate-400 hover:text-slate-600"
      : "text-slate-600 hover:text-slate-950";

  return (
    <a
      className={`inline-flex items-center justify-center no-underline transition ${sizeClass} ${toneClass}`}
      data-ds-block="website-builder.button.link"
      data-ds-layer="singlepage"
      href={href}
    >
      {label}
    </a>
  );
}
