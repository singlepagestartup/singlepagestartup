import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  Play,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface ButtonSecondaryProps {
  label: string;
  href: string;
  icon?: ModuleIcon;
  inverse?: boolean;
  target?: "_self" | "_top";
}

export const defaultButtonSecondaryProps: ButtonSecondaryProps = {
  label: "Learn more",
  href: "#features",
  icon: Play,
};

export function ButtonSecondary(props?: Partial<ButtonSecondaryProps>) {
  const label = props?.label ?? defaultButtonSecondaryProps.label;
  const href = props?.href ?? defaultButtonSecondaryProps.href;
  const Icon = props?.icon ?? Play;

  return (
    <a
      className={
        props?.inverse
          ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-4 text-sm font-semibold text-white no-underline hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sps-green"
          : `${kit.secondary} no-underline hover:bg-[var(--workspace-brand-background)]`
      }
      data-ds-block="website-builder.button.secondary"
      data-ds-layer="singlepage"
      href={href}
      target={props?.target}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </a>
  );
}
