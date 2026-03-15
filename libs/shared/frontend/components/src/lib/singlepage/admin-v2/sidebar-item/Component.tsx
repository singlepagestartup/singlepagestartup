import Link from "next/link";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { cn } from "@sps/shared-frontend-client-utils";
import { IComponentPropsExtended, IComponentProps } from "./interface";

export function Component<M extends { id: string }, V>(
  props: IComponentPropsExtended<M, V, IComponentProps<M, V>> & {},
) {
  console.log("🚀 ~ Component ~ props:", props);
  return (
    <Button
      asChild
      type="button"
      variant="outline"
      data-module={props.module}
      data-variant={props.variant}
      {...(props.type === "relation"
        ? {
            "data-relation": props.name,
          }
        : {
            "data-model": props.name,
          })}
      className={cn(
        "!w-full justify-start rounded-md border px-3 py-2 text-left text-sm",
        props.isActive
          ? "border-slate-900 bg-slate-900 text-white shadow-sm font-semibold hover:bg-slate-900"
          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white",
      )}
    >
      <Link href={`${ADMIN_BASE_PATH}/${props.module}/${props.name}`}>
        <span
          className={cn(
            "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
            props.isActive ? "bg-white" : "bg-slate-300",
          )}
        />
        <span className="ml-2 truncate">{props.name}</span>
      </Link>
    </Button>
  );
}
