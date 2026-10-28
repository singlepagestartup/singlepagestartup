"use client";
import { usePathname } from "next/navigation";
import { saveLanguageContext } from "@sps/shared-utils";
import { internationalization } from "@sps/shared-configuration";
import { Component as Action } from "../action/Component";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const pathname = usePathname();
  const href = saveLanguageContext(
    props.data.url || "",
    props.language,
    internationalization.languages,
  );
  const current =
    !!pathname &&
    href.split(/[?#]/)[0].replace(/\/$/, "") === pathname.replace(/\/$/, "") &&
    !href.includes("#");
  return (
    <Action
      data={props.data}
      language={props.language}
      variant="navigation"
      isServer={false}
      className={props.className}
      current={current}
    />
  );
}
