import { z } from "zod";
import {
  insertSchema,
  type ISelectSchema as IModel,
} from "@sps/host/models/metadata/backend/repository/database";
import type { IResolvedPage } from "@sps/host/models/page/sdk/model";

export interface ISeoImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** Serializable SEO values; the Host adapter restores Next's URL instance. */
export interface ISeoMetadata {
  metadataBase: string;
  title?: string;
  description?: string;
  alternates?: { canonical: string };
  robots?: { index: boolean; follow: boolean };
  authors?: { name: string }[];
  keywords?: string[];
  icons?: { url: string }[];
  openGraph?: {
    title?: string;
    description?: string;
    type: "article" | "website";
    url: string;
    siteName?: string;
    locale?: string;
    images?: ISeoImage[];
  };
  twitter?: {
    card: "summary" | "summary_large_image";
    title?: string;
    description?: string;
    site?: string;
    creator?: string;
    images?: ISeoImage[];
  };
}

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
  language: string;
  metadata: Partial<IModel>;
}

export const seoResolveSchema = z.object({
  url: z.string().max(2048).startsWith("/"),
  language: z.string().max(16),
});
export const seoPreviewSchema = seoResolveSchema.extend({
  metadata: insertSchema.partial(),
});
