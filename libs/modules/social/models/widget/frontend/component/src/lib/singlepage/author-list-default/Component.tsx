import Client from "./client";
import type { IComponentPropsExtended } from "./interface";
/** Public pagination runs in one client reader; only saved presentation inputs cross RSC. */
export function Component(props: IComponentPropsExtended) {
  return (
    <Client
      isServer={false}
      variant={props.variant}
      data={props.data}
      language={props.language}
      className={props.className}
    />
  );
}
