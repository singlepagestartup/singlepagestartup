import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <section
      aria-label="Active chat"
      data-module="social"
      data-model="chat"
      data-variant={props.variant}
      data-id={props.data.id}
      className="@container/chat flex min-h-0 min-w-0 flex-1 flex-col"
    >
      {props.children}
    </section>
  );
}
