import Client from "./client";
import { Skeleton } from "./Skeleton";
import type { IComponentProps } from "./interface";

/** Protected bytes are never rendered or loaded into an RSC payload. */
export function Component(props: IComponentProps) {
  if (props.isServer) return <Skeleton />;
  return (
    <Client
      isServer={false}
      variant={props.variant}
      dataSource="props"
      data={props.data}
      language={props.language}
      className={props.className}
      containerClassName={props.containerClassName}
    />
  );
}
