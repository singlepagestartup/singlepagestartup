import { Button } from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import Link from "next/link";

export function Component(props: IComponentPropsExtended) {
  return (
    <Button
      data-module="ecommerce"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      variant="outline"
      size="sm"
      asChild={true}
      className="w-fit flex items-center"
    >
      <Link href={`/ecommerce/categories/${props.data?.slug}`}>
        {props.data?.title?.[props.language] || props.data?.slug}
      </Link>
    </Button>
  );
}
