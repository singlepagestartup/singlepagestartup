import type { Control, FieldValues } from "react-hook-form";
export interface IComponentProps<T extends FieldValues> {
  control: Control<T>;
  metadataId?: string;
}

import type { IPageSeoResult } from "@sps/host/models/metadata/sdk/server";
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
