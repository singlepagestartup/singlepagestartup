"use server";
import "server-only";
import { api as pageApi } from "@sps/host/models/page/sdk/server";
import type { IComponentProps } from "./interface";
import { Component as ChildComponent } from "./Component";

export default async function Server(props: IComponentProps) {
  const { page, structuredData } = await pageApi.resolvePageSeo(
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
