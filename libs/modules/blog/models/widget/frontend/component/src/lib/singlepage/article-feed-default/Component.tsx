import Client from "./client";
import type { IComponentPropsExtended } from "./interface";
/** Server callbacks stay server-side; the client consumer supplies its own port. */
export function Component(props: IComponentPropsExtended) {
  return (
    <Client
      isServer={false}
      variant={props.variant}
      data={props.data}
      language={props.language}
      className={props.className}
      renderAuthor={props.isServer ? undefined : props.renderAuthor}
    />
  );
}
