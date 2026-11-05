import type { NextRequestOptions } from "@sps/shared-utils";
import type { IModel as IMetadata } from "@sps/host/models/metadata/sdk/model";
import type { Metadata } from "next";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";

export interface IGeneratePageSeoProps {
  /** Concrete pathname, optionally prefixed with a configured locale. */
  url: string;
  language?: string;
  /** Legacy input; the API resolves the authoritative Page from URL and locale. */
  page?: IResolvedPage;
  /** Retained for compatibility; SEO reads propagate failures. */
  catchErrors?: boolean;
  metadataDraft?: Partial<IMetadata>;
  /** Preview reads bypass the public ISR data cache. */
  options?: Partial<NextRequestOptions>;
}

export interface IPageSeoResult {
  metadata: Metadata;
  structuredData: Record<string, unknown>[];
  diagnostics?: string[];
}
