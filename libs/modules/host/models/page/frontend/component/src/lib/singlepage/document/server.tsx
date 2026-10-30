"use server";
import "server-only";
import { api as metadataApi } from "@sps/host/models/metadata/sdk/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default async function Server(props: IComponentProps) {
  const { page, structuredData } = await metadataApi.resolvePageSeo(
    props.url,
    props.language,
  );
  return (
    <ChildComponent
      isServer={true}
      variant="document"
      url={props.url}
      language={props.language}
      data={page}
      structuredData={structuredData}
    />
  );
}
