import type { IComponentProps, ButtonLinkProps } from "./interface";
export type { ButtonLinkProps } from "./interface";

export const defaultButtonLinkProps: ButtonLinkProps = {
  label: "Privacy",
  href: "/privacy",
  size: "sm",
  tone: "default",
};

export function ButtonLink(props?: IComponentProps) {
  const label = props?.label ?? defaultButtonLinkProps.label;
  const href = props?.href ?? defaultButtonLinkProps.href;
  const size = props?.size ?? defaultButtonLinkProps.size;
  const tone = props?.tone ?? defaultButtonLinkProps.tone;
  const sizeClass = size === "xs" ? "text-xs" : "text-sm";
  const toneClass =
    tone === "muted"
      ? "text-muted-foreground hover:text-foreground"
      : "text-muted-foreground hover:text-foreground";

  return (
    <a
      className={`inline-flex min-h-11 min-w-11 max-w-full items-center justify-center rounded-xl no-underline underline-offset-4 transition hover:underline motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${sizeClass} ${toneClass}`}
      data-ds-block="website-builder.button.link"
      data-ds-layer="singlepage"
      href={href}
      target={props?.target}
      data-module="website-builder"
      data-model="button"
      data-variant={props?.variant ?? "link"}
    >
      {label}
    </a>
  );
}
