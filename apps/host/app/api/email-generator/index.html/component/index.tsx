import { IComponentProps } from "./interface";
import { variants } from "./variants";

export function Component(props: IComponentProps) {
  // Own-property lookup only, so a variant naming an inherited member cannot
  // resolve to a prototype function and reach the renderer.
  const Comp = Object.hasOwn(variants, props.variant)
    ? variants[props.variant]
    : undefined;

  if (!Comp) {
    return <></>;
  }

  // type guards works on component rendering
  // as any here is required for dynamic import
  // or you can use switch case, but it's not recommended
  return <Comp {...(props as any)} />;
}
