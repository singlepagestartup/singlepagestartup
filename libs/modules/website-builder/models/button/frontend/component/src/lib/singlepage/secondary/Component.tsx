import { IComponentPropsExtended } from "./interface";
import Link from "next/link";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";

export function Component(props: IComponentPropsExtended) {
  const withProtocol = props.data.url?.includes(":");
  const href = saveLanguageContext(
    props.data.url || "",
    props.language,
    internationalization.languages,
  );

  return (
    <Button
      data-module="website-builder"
      data-model="button"
      data-id={props.data?.id || ""}
      data-variant={props.data.variant}
      className={cn("w-full", props.data.className)}
      variant="secondary"
      asChild={true}
    >
      <Link href={href} target={withProtocol ? "_blank" : undefined}>
        {props.data.title?.[props.language]}
      </Link>
    </Button>
  );
}
