import { Component as Page } from "@sps/host/models/page/frontend/component";
import { safeJsonLd } from "@sps/shared-utils";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  return (
    <>
      {props.structuredData.length ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(props.structuredData) }}
        />
      ) : null}
      <Page
        isServer={true}
        variant={props.data.variant as any}
        dataSource="props"
        data={props.data}
        url={props.url}
        language={props.language}
      />
    </>
  );
}
