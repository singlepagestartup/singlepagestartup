import { cn } from "@sps/shared-frontend-client-utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      className={cn(
        "mb-2 flex items-center gap-2 text-sm text-muted-foreground",
        props.className,
      )}
    >
      <Link
        href={props.moduleHref}
        className="transition hover:text-foreground"
      >
        {props.moduleName}
      </Link>
      <ChevronRight className="h-4 w-4" />
      <Link
        href={props.modelHref}
        className="font-medium text-foreground transition hover:underline"
      >
        {props.modelName}
      </Link>
    </div>
  );
}
