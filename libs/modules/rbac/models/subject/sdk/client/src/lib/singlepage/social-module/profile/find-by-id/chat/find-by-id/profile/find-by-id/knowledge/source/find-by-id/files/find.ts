"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { route, clientHost } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { queryClient, subscription } from "@sps/shared-frontend-client-api";
import { deriveTopicsFromPath } from "@sps/shared-utils";
import {
  action as find,
  IProps,
  IResult,
} from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/find";
export { type IProps, type IResult };
export function action(props: IProps) {
  const queryKey = `${route}/${props.id}/social-module/profiles/${props.socialModuleProfileId}/chats/${props.socialModuleChatId}/profiles/${props.targetSocialModuleProfileId}/knowledge/sources/${props.knowledgeModuleSourceId}/files`;
  useEffect(() => subscription(queryKey, queryClient), [queryKey]);
  return useQuery({
    queryKey: [queryKey],
    meta: {
      topics: [
        ...deriveTopicsFromPath(queryKey),
        "knowledge.sources",
        "knowledge.sources-to-file-storage-module-files",
        "file-storage.files",
      ],
    },
    queryFn: () =>
      find({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
  });
}
