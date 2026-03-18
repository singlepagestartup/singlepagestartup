import { IComponentProps, IComponentPropsExtended } from "./interface";

export function Component<M extends { id?: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>>,
) {
  return props.children;
}
