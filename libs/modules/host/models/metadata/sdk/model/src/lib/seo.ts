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
