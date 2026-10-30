import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import { twMerge } from "tailwind-merge";
import type { IComponentPropsExtended } from "./interface";
export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      className={twMerge("flex flex-wrap items-center gap-3", props.className)}
    >
      {props.data.map((author) => (
        <SocialModuleProfile
          key={author.id}
          isServer={props.isServer}
          variant="author-byline-default"
          dataSource="props"
          data={author}
          language={props.language}
          size="xs"
        />
      ))}
    </div>
  );
}
