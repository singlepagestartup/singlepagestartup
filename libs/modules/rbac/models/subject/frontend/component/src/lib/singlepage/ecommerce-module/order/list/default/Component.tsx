import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return props.children?.({ data: props.data }) ?? null;
}
