import { shouldHideRecord } from "@sps/shared-utils/public-read";
import { IComponentProps } from "./interface";
import { variants } from "./variants";

export function Component(props: IComponentProps) {
  if (
    shouldHideRecord(
      "data" in props ? props.data : undefined,
      (props as any).variant,
    )
  )
    return null;
  const Comp = variants[(props as any).variant];

  if (!Comp) {
    return <></>;
  }

  // type guards works on component rendering
  // as any here is required for dynamic import
  // or you can use switch case, but it's not recommended
  return <Comp {...(props as any)} />;
}
