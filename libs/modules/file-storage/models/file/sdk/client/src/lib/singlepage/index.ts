"use client";
import {
  action as content,
  type IProps as IContentProps,
  type IResult as IContentResult,
} from "./content";

import {
  IModel,
  route,
  clientHost,
  query,
  options,
} from "@sps/file-storage/models/file/sdk/model";
import { factory, queryClient } from "@sps/shared-frontend-client-api";
import {
  action as download,
  type IProps as IDownloadProps,
  type IResult as IDownloadResult,
} from "./download";
import {
  action as previewText,
  type IProps as IPreviewTextProps,
  type IResult as IPreviewTextResult,
} from "./preview-text";
export { Provider, queryClient } from "@sps/shared-frontend-client-api";

export type IProps = {
  IContentProps: IContentProps;
  IPreviewTextProps: IPreviewTextProps;
  IDownloadProps: IDownloadProps;
};

export type IResult = {
  IContentResult: IContentResult;
  IPreviewTextResult: IPreviewTextResult;
  IDownloadResult: IDownloadResult;
};

export const api = {
  content,
  ...factory<IModel>({
    queryClient,
    route,
    host: clientHost,
    params: query,
    options,
  }),
  previewText,
  download,
};
