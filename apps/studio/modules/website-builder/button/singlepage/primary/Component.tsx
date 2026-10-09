import { kit } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowRight,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface ButtonPrimaryProps {
  label: string;
  href: string;
  icon?: ModuleIcon;
}

export const defaultButtonPrimaryProps: ButtonPrimaryProps = {
  label: "Open admin panel",
  href: "/admin",
  icon: ArrowRight,
};

export function ButtonPrimary(props?: Partial<ButtonPrimaryProps>) {
  const label = props?.label ?? defaultButtonPrimaryProps.label;
  const href = props?.href ?? defaultButtonPrimaryProps.href;
  const Icon = props?.icon ?? ArrowRight;

  return (
    <a
      className={`${kit.button} no-underline hover:brightness-95`}
      data-ds-block="website-builder.button.primary"
      data-ds-layer="singlepage"
      href={href}
    >
      {label}
      <Icon className="h-5 w-5 shrink-0" />
    </a>
  );
}
