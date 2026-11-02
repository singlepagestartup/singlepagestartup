import { z } from "zod";
import {
  insertSchema as metadataInsertSchema,
  type IModel as IMetadata,
  type ISeoMetadata,
} from "@sps/host/models/metadata/sdk/model";
import type { IResolvedPage } from "./index";
export type {
  ISeoImage,
  ISeoMetadata,
} from "@sps/host/models/metadata/sdk/model";

export interface IPageSeoResult {
  metadata: ISeoMetadata;
  structuredData: Record<string, unknown>[];
  diagnostics?: string[];
}

export interface IResolvedPageSeo extends IPageSeoResult {
  page: IResolvedPage;
}

export interface ISeoPreviewProps {
  url: string;
  metadata: Partial<IMetadata>;
}

export const seoResolveSchema = z.object({
  url: z.string().max(2048).startsWith("/"),
});
export const seoPreviewSchema = seoResolveSchema.extend({
  metadata: metadataInsertSchema.partial(),
});
