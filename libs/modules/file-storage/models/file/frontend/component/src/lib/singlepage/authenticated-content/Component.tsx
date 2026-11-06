import { Component as ClientComponent } from "./ClientComponent";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      variant={props.variant}
      dataSource="props"
      data={props.data}
      language={props.language}
      className={props.className}
      containerClassName={props.containerClassName}
      content={props.content}
      loading={props.loading}
      error={props.error}
      onRetry={props.onRetry}
    />
  );
}
