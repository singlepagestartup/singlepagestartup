import type { IResolvedPage } from "@sps/host/models/page/sdk/model";
import type { IPageSeoResult } from "@sps/host/models/metadata/sdk/server";

export const variant = "document" as const;

/** Server-only route reader: Page lookup and SEO must settle before any Suspense boundary. */
export interface IComponentProps {
  variant: typeof variant;
  isServer: true;
  url: string;
  language: string;
}

export interface IComponentPropsExtended extends IComponentProps {
  data: IResolvedPage;
  structuredData: IPageSeoResult["structuredData"];
}
