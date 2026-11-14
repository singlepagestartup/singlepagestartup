import { IComponentProps } from "./interface";
import Server from "./server";

export { type IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return <Server {...props} />;
}
