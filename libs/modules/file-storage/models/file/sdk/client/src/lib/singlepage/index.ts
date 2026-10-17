"use client";

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
  IPreviewTextProps: IPreviewTextProps;
  IDownloadProps: IDownloadProps;
};

export type IResult = {
  IPreviewTextResult: IPreviewTextResult;
  IDownloadResult: IDownloadResult;
};

export const api = {
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
