import { IComponentProps } from "./interface";
import { variants } from "./variants";

export function Component(props: IComponentProps) {
  const Comp = variants[props.variant];

  if (!Comp) {
    return <></>;
  }

  return <Comp {...(props as any)} />;
}
