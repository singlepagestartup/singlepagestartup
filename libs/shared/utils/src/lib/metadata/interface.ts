export interface IEntityMetadata {
  seo?: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    keywords?: Record<string, string[]>;
  };
  [section: string]: unknown;
}

export interface IMetadataReference {
  source: string;
  relations: string[];
  target: string;
  path: string[];
}

export interface IMetadataTemplateOptions {
  language: string;
  list?: boolean;
  resolve: (reference: IMetadataReference) => unknown | Promise<unknown>;
}
