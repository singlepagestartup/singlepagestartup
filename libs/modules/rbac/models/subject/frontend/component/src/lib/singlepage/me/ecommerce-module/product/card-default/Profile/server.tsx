"use server";
import "server-only";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/server";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { IProductAuthorProps } from "./interface";
export default async function Server(props: IProductAuthorProps) {
  if (!props.ecommerceModuleProductId) return null;
  const authors = await socialProfileApi.authorFind({
    params: { ecommerceModuleProductId: props.ecommerceModuleProductId },
  });
  return (
    <div className="flex flex-wrap items-center gap-3">
      {authors.map((author) => (
        <SocialModuleProfile
          key={author.id}
          isServer
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
