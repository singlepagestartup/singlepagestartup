import type { IComponentPropsExtended } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";

export function Component(props: IComponentPropsExtended) {
  return (
    <ClientComponent
      isServer={false}
      data={props.data}
      language={props.language}
      className={props.className}
      open={props.open}
      orderIndex={props.orderIndex}
      profileId={props.profileId}
      isSubmitting={props.isSubmitting}
      mode={props.mode}
      onOpenChange={props.onOpenChange}
      onCreate={props.onCreate}
      onUpdate={props.onUpdate}
    />
  );
}
