import { IComponentPropsExtended } from "./interface";
import Server from "./server";

export function Component(props: IComponentPropsExtended) {
  return <Server {...props} />;
}
