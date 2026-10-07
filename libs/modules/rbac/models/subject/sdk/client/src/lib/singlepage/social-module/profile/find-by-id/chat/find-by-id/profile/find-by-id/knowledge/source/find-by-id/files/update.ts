"use client";
import { useMutation } from "@tanstack/react-query";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import {
  queryClient,
  patchInListQueries,
} from "@sps/shared-frontend-client-api";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  action as update,
  IProps,
  IResult,
} from "@sps/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/source/find-by-id/files/update";
export { type IProps, type IResult };
export function action(props: { onSuccess?: (result: IResult) => void }) {
  return useMutation({
    mutationFn: (input: IProps) =>
      update({
        ...input,
        host: clientHost,
        options: {
          ...input.options,
          headers: saturateHeaders(input.options?.headers),
        },
      }),
    onSuccess(result, input) {
      if (result.source)
        patchInListQueries(
          queryClient,
          "/api/knowledge/sources",
          result.source.id,
          result.source,
        );
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: "/api/knowledge/sources-to-file-storage-module-files",
        props: input,
        result,
        timestamp: Date.now(),
        requestId: createId(),
      });
      props.onSuccess?.(result);
    },
  });
}
