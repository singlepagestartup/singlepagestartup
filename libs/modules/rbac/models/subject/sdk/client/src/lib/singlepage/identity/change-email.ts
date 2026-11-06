"use client";
import { useMutation } from "@tanstack/react-query";
import { clientHost, route } from "@sps/rbac/models/subject/sdk/model";
import { api, type IProps } from "@sps/rbac/models/subject/sdk/server";

type IRequestProps = IProps["IIdentityChangeEmailRequestProps"];
type IVerifyProps = IProps["IIdentityChangeEmailVerifyProps"];
import { saturateHeaders } from "@sps/shared-frontend-client-utils";
import { globalActionsStore } from "@sps/shared-frontend-client-store";
import { createId } from "@paralleldrive/cuid2";
import {
  patchInListQueries,
  queryClient,
} from "@sps/shared-frontend-client-api";
export function request() {
  return useMutation({
    mutationKey: [`${route}/:id/identities/:identityId/email-change/code`],
    mutationFn: (props: IRequestProps) =>
      api.identityChangeEmailRequest({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
    onSuccess(_result, props) {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/identities/${props.identityId}/email-change/code`,
        props: { id: props.id, identityId: props.identityId },
        timestamp: Date.now(),
        requestId: createId(),
      });
    },
  });
}
export function verify() {
  return useMutation({
    mutationKey: [`${route}/:id/identities/:identityId/email-change/verify`],
    mutationFn: (props: IVerifyProps) =>
      api.identityChangeEmailVerify({
        ...props,
        host: clientHost,
        options: {
          ...props.options,
          headers: saturateHeaders(props.options?.headers),
        },
      }),
    onSuccess: (result, props) => {
      globalActionsStore.getState().addAction({
        type: "mutation",
        name: `${route}/${props.id}/identities/${props.identityId}/email-change/verify`,
        props: { id: props.id, identityId: props.identityId },
        result: { stage: result.stage },
        timestamp: Date.now(),
        requestId: createId(),
      });
      if (result.stage !== "complete") return;
      const identity = result.identity;
      patchInListQueries(
        queryClient,
        `${route}/${props.id}/identities`,
        identity.id,
        identity,
      );
      patchInListQueries(
        queryClient,
        "/api/rbac/identities",
        identity.id,
        identity,
      );
      queryClient.setQueriesData(
        { queryKey: [`/api/rbac/identities/${identity.id}`] },
        identity,
      );
    },
  });
}
