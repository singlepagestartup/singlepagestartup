import { Button } from "@sps/shared-ui-shadcn";
import { IComponentPropsExtended } from "./interface";
import Link from "next/link";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";

export function Component(props: IComponentPropsExtended) {
  const href = saveLanguageContext(
    `/ecommerce/categories/${props.data.slug}`,
    props.language,
    internationalization.languages,
  );

  return (
    <Button
      data-module="ecommerce"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      variant="outline"
      size="sm"
      asChild={true}
      className={cn(
        "w-fill flex items-center",
        props.data.className,
        props.className,
      )}
    >
      <Link href={href}>
        {props.data?.title?.[props.language] || props.data?.slug}
      </Link>
    </Button>
  );
}
