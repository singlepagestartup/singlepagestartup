import type { Control } from "react-hook-form";
import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IInsertSchema as IMetadataDraft } from "@sps/host/models/metadata/sdk/model";
export const variant = "seo-preview" as const;
/** Client-only form operation; Control is owned by the surrounding Metadata form. */
export interface IComponentProps extends ISpsComponentBase {
  variant: typeof variant;
  isServer: false;
  control: Control<IMetadataDraft>;
  metadataId?: string;
}
import type { IPageSeoResult } from "@sps/host/models/page/sdk/model";
export interface IPreviewViewProps {
  id: string;
  url: string;
  language: string;
  setUrl: (url: string) => void;
  setLanguage: (language: string) => void;
  onPreview: () => void;
  isFetching: boolean;
  error?: string;
  result?: IPageSeoResult;
  title: string;
  image: string;
  indexable: boolean;
}
