"use client";

import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export function protectedFileContent(
  props: Parameters<typeof api.protectedFileContent>[0],
) {
  return api.protectedFileContent({
    ...props,
    host: props.host ?? clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  });
}
