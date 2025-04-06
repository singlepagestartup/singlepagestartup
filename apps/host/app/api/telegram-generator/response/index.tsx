import { IComponentProps } from "./interface";
import { variants } from "./variants";

export function response(props: IComponentProps) {
  const resp = variants[props.variant];

  if (!resp) {
    return {};
  }

  // type guards works on component rendering
  // as any here is required for dynamic import
  // or you can use switch case, but it's not recommended
  return resp(props as any);
}
