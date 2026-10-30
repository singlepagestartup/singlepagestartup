import type { NextRequestOptions } from "@sps/shared-utils";
import type {
  IModel as IMetadata,
  ISeoImage,
} from "@sps/host/models/metadata/sdk/model";
export type { ISeoImage } from "@sps/host/models/metadata/sdk/model";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";

export interface IGeneratePageSeoProps {
  /** Concrete pathname, optionally prefixed with a configured locale. */
  url: string;
  language?: string;
  /** Reuse the Page resolved by the Host before it starts its response. */
  page?: IResolvedPage;
  /** Retained for compatibility; SEO reads propagate failures. */
  catchErrors?: boolean;
  metadataDraft?: Partial<IMetadata>;
  /** Preview reads bypass the public ISR data cache. */
  options?: Partial<NextRequestOptions>;
}
