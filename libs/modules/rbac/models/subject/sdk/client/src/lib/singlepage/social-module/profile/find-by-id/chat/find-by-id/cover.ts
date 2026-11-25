"use client";

import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";

export function socialModuleProfileChatCoverContent(
  props: Parameters<typeof api.socialModuleProfileChatCoverContent>[0],
) {
  return api.socialModuleProfileChatCoverContent({
    ...props,
    host: props.host ?? clientHost,
    options: {
      ...props.options,
      headers: saturateHeaders(props.options?.headers),
    },
  });
}
