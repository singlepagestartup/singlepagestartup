import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return props.children;
}
