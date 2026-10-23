"use client";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/client";
import { Component as SocialModuleProfile } from "@sps/social/models/profile/frontend/component";
import type { IProductAuthorProps } from "./interface";
export default function Client(props: IProductAuthorProps) {
  const authors = socialProfileApi.authorFind({
    params: { ecommerceModuleProductId: props.ecommerceModuleProductId },
    reactQueryOptions: { enabled: !!props.ecommerceModuleProductId },
  });
  if (!props.ecommerceModuleProductId || (authors.isError && !authors.data))
    return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {authors.data?.map((author) => (
        <SocialModuleProfile
          key={author.id}
          isServer={false}
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
