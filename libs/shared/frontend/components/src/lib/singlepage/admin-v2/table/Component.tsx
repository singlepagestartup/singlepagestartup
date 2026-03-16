import { IComponentProps } from "./interface";

export function Component<M extends { id?: string }, V>(
  props: IComponentProps<M, V>,
) {
  return props.children;
}
