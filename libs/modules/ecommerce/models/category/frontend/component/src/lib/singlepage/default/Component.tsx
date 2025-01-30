import Link from "next/link";
import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="startup"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.data.className)}
    >
      <Link href={`/ecommerce/categories/${props.data.id}`} className="w-fit">
        <p className="font-bold text-4xl">
          {props.data.title?.[props.language]}
        </p>
      </Link>
    </div>
  );
}
