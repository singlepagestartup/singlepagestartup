import { ArrowRight, type LucideIcon } from "lucide-react";

export interface ButtonPrimaryProps {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export const defaultButtonPrimaryProps: ButtonPrimaryProps = {
  label: "Open Admin Panel",
  href: "/admin",
  icon: ArrowRight,
};

export function ButtonPrimary(props?: Partial<ButtonPrimaryProps>) {
  const label = props?.label ?? defaultButtonPrimaryProps.label;
  const href = props?.href ?? defaultButtonPrimaryProps.href;
  const Icon = props?.icon ?? ArrowRight;

  return (
    <a
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-5 py-2.5 text-sm text-white no-underline shadow-sm transition hover:bg-slate-800"
      data-ds-block="website-builder.button.primary"
      data-ds-layer="singlepage"
      href={href}
    >
      {label}
      <Icon className="h-4 w-4" />
    </a>
  );
}
