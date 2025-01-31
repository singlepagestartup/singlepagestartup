import { IComponentPropsExtended } from "./interface";
import Link from "next/link";
import { cn } from "@sps/shared-frontend-client-utils";
import { Button } from "@sps/shared-ui-shadcn";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const httpLink = props.data.url?.startsWith("http");
  const languageSwitcher = internationalization.languages.find((language) => {
    return "/" + language.code === props.data.url;
  });
  const saveLanguageLink = languageSwitcher
    ? props.data.url || "/"
    : `/${props.language}${props.data.url}`;

  return (
    <Button
      data-module="website-builder"
      data-model="button"
      data-id={props.data?.id || ""}
      data-variant={props.data.variant}
      className={cn("w-full", props.data.className)}
      variant="ghost"
      asChild={true}
    >
      <Link href={httpLink ? props.data.url || "" : saveLanguageLink}>
        {props.data.title?.[props.language]}
      </Link>
    </Button>
  );
}
