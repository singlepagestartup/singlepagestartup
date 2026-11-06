"use server";
import "server-only";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/server";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps } from "./interface";
export default async function Server(props: IComponentProps) {
  if (!props.ecommerceModuleProductId) return null;
  const authors = await socialProfileApi.authorFind({
    params: { ecommerceModuleProductId: props.ecommerceModuleProductId },
  });
  return (
    <ChildComponent
      isServer={true}
      variant={props.variant}
      ecommerceModuleProductId={props.ecommerceModuleProductId}
      language={props.language}
      className={props.className}
      data={authors}
    />
  );
}
