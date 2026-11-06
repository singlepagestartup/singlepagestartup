"use client";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/client";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default function Client(props: IComponentProps) {
  const authors = socialProfileApi.authorFind({
    params: { ecommerceModuleProductId: props.ecommerceModuleProductId },
    reactQueryOptions: { enabled: !!props.ecommerceModuleProductId },
  });
  if (!props.ecommerceModuleProductId || (authors.isError && !authors.data))
    return null;
  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      ecommerceModuleProductId={props.ecommerceModuleProductId}
      language={props.language}
      className={props.className}
      data={authors.data || []}
    />
  );
}
