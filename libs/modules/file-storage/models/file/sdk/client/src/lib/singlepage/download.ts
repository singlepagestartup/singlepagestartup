"use client";
import { getFilePreviewUrl } from "@sps/shared-frontend-client-utils";

export interface IProps {
  src: string;
  signal?: AbortSignal;
}
export type IResult = Blob;

export async function action(props: IProps): Promise<IResult> {
  const src = getFilePreviewUrl(props.src);
  if (!src) throw new Error("This file URL cannot be downloaded.");
  const response = await fetch(src, {
    credentials: "omit",
    signal: props.signal,
  });
  if (!response.ok) throw new Error("This file could not be downloaded.");
  return response.blob();
}
