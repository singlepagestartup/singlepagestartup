import { cn } from "@sps/shared-frontend-client-utils/cn";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const store = props.data;
  const title =
    store.title?.[props.language]?.trim() ||
    Object.values(store.title ?? {}).find((value) => value?.trim()) ||
    store.adminTitle?.trim() ||
    store.slug;

  return (
    <header
      data-module="ecommerce"
      data-model="store"
      data-id={store.id}
      data-variant={props.variant}
      className={cn(
        "min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground",
        props.className,
      )}
    >
      <h1 className="break-words px-5 py-6 text-3xl font-semibold tracking-tight sm:px-6 sm:py-8">
        {title}
      </h1>
      {props.children}
    </header>
  );
}
