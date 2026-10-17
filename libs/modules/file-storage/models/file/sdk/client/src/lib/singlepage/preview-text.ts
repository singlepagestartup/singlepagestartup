"use client";
import { useEffect } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import {
  FILE_PREVIEW_TEXT_MAX_BYTES,
  NEXT_PUBLIC_API_SERVICE_URL,
  deriveTopicsFromPath,
} from "@sps/shared-utils";
import { getFilePreviewUrl } from "@sps/shared-frontend-client-utils";
import { route, type IModel } from "@sps/file-storage/models/file/sdk/model";

export interface IProps {
  file: Pick<IModel, "id" | "file" | "updatedAt" | "size">;
  reactQueryOptions?: Partial<UseQueryOptions<string>>;
}
export type IResult = string;

/** Stored public bytes only; scoped parents still own File authorization/metadata. */
export async function readPreviewText(
  src: string,
  signal?: AbortSignal,
): Promise<string> {
  const url = getFilePreviewUrl(src);
  if (!url) throw new Error("This file URL cannot be previewed.");
  const response = await fetch(url, {
    signal,
    credentials: "omit",
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      "This file could not be loaded. Open or download the original.",
    );
  if (
    Number(response.headers.get("content-length")) > FILE_PREVIEW_TEXT_MAX_BYTES
  ) {
    await response.body?.cancel();
    throw new Error(
      "This file is too large for text preview. Open or download the original.",
    );
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const data = await response.arrayBuffer();
    if (data.byteLength > FILE_PREVIEW_TEXT_MAX_BYTES)
      throw new Error(
        "This file is too large for text preview. Open or download the original.",
      );
    return new TextDecoder().decode(data);
  }
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > FILE_PREVIEW_TEXT_MAX_BYTES) {
        await reader.cancel();
        throw new Error(
          "This file is too large for text preview. Open or download the original.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

export function action(props: IProps) {
  const key = `${route}/${props.file.id}/preview-text`;
  useEffect(
    () => subscription(`${route}/${props.file.id}`, queryClient),
    [props.file.id],
  );
  const { meta, ...options } = props.reactQueryOptions || {};
  return useQuery<string>(
    {
      queryKey: [key, props.file.file, props.file.updatedAt],
      queryFn: ({ signal }) => {
        if ((props.file.size || 0) > FILE_PREVIEW_TEXT_MAX_BYTES)
          throw new Error(
            "This file is too large for text preview. Open or download the original.",
          );
        const src = /^https?:\/\//i.test(props.file.file)
          ? props.file.file
          : `${NEXT_PUBLIC_API_SERVICE_URL}/public${props.file.file}`;
        return readPreviewText(src, signal);
      },
      staleTime: 60_000,
      gcTime: 120_000,
      retry: false,
      meta: {
        topics: deriveTopicsFromPath(`${route}/${props.file.id}`),
        ...meta,
      },
      ...options,
    },
    queryClient,
  );
}
