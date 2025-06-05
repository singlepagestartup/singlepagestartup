import { IComponentPropsExtended } from "./interface";
import Link from "next/link";
import { cn } from "@sps/shared-frontend-client-utils";
import { internationalization } from "@sps/shared-configuration";

export function Component(props: IComponentPropsExtended) {
  const withProtocol = props.data.url?.includes(":");
  const languageSwitcher = internationalization.languages.find((language) => {
    return "/" + language.code === props.data.url;
  });
  const saveLanguageLink = languageSwitcher
    ? props.data.url || "/"
    : `/${props.language}${props.data.url}`;

  return (
    <Link
      data-module="website-builder"
      data-model="button"
      data-id={props.data?.id || ""}
      data-variant={props.data.variant}
      className={cn("w-full flex", props.data.className, props.className)}
      href={withProtocol ? props.data.url || "" : saveLanguageLink}
      target={withProtocol ? "_blank" : undefined}
    >
      {props.children}
    </Link>
  );
}
