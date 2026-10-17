import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <section
      data-module="social"
      data-model="profile"
      data-variant="id-ai-chat-project"
      data-id={props.data.id}
      className="flex h-[calc(100dvh-9rem)] min-h-[560px] min-w-0 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <aside className="hidden w-56 shrink-0 overflow-y-auto bg-default p-4 text-default-foreground lg:block">
        {props.navigation}
      </aside>
      {props.children}
    </section>
  );
}
