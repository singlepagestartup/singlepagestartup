export type Metadata = {
  description?: string;
  icons?: Array<{ url: string }> | { icon?: Array<{ url: string }> };
  image?: string;
  keywords?: string[];
  openGraph?: {
    description?: string;
    image?: string;
    images?: string;
    title?: string;
    type?: string;
    url?: string;
  };
  title?: string;
  twitter?: {
    description?: string;
    image?: string;
    images?: string;
    title?: string;
  };
  url?: string;
};
