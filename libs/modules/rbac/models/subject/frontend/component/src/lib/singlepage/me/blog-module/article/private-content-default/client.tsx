"use client";
import "client-only";
import { useCallback, useEffect, useMemo, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { clientHost } from "@sps/rbac/models/subject/sdk/model";
import { consistencyQueryKey } from "@sps/shared-frontend-client-api";
import AuthenticationMe from "../../../../authentication/me-default/client";
import { Component as BlogModuleArticle } from "@sps/blog/models/article/frontend/component";
import { Component as ChildComponent } from "./Component";
import type { IComponentProps, IComponentPropsExtended } from "./interface";
export default function Client(props: IComponentProps) {
  return (
    <AuthenticationMe
      isServer={false}
      variant="authentication-me-default"
      fallback={
        <BlogModuleArticle
          isServer={false}
          variant="private-content-default"
          language={props.language}
          access="guest"
          actionHref={`/${props.language}/rbac/subject/authentication/select-method`}
        />
      }
    >
      {({ data }) =>
        data ? (
          <ContentReader
            key={`${data.id}:${props.blogModuleArticle.id}`}
            {...props}
            data={data}
          />
        ) : null
      }
    </AuthenticationMe>
  );
}
function ContentReader(
  props: IComponentProps & Pick<IComponentPropsExtended, "data">,
) {
  const queryClient = useQueryClient();
  const readerId = useId();
  const [expiredVersion, setExpiredVersion] = useState<string | null>(null);
  const query = api.blogModuleArticleFindByIdContentFind({
    ...props.apiProps,
    id: props.data.id,
    blogModuleArticleId: props.blogModuleArticle.id,
  });
  const path = `/api/rbac/subjects/${props.data.id}/blog-module/articles/${props.blogModuleArticle.id}/content`;
  const identity = consistencyQueryKey(path, undefined, clientHost)[2] as
    | { principal?: string; host?: string }
    | undefined;
  const partition = useMemo(
    () => ({ principal: identity?.principal, host: identity?.host }),
    [identity?.principal, identity?.host],
  );
  const contentFilter = useMemo(
    () => ({
      predicate: (candidate: { queryKey: readonly unknown[] }) => {
        const [candidatePath, , identity] = candidate.queryKey;
        const scope = identity as
          | { principal?: string; host?: string }
          | undefined;
        return (
          candidatePath === path &&
          scope?.principal === partition.principal &&
          scope?.host === partition.host
        );
      },
    }),
    [partition, path],
  );
  const clearContentData = useCallback(async () => {
    await queryClient.cancelQueries(contentFilter);
    // Keep the shared operation's active observers attached for canonical refetch.
    for (const cached of queryClient.getQueryCache().findAll(contentFilter))
      cached.setState({ data: undefined, dataUpdatedAt: 0 });
  }, [queryClient, contentFilter]);
  const deadline = useMemo(() => {
    const content = query.data;
    if (!content) return null;
    const expires = content.items.flatMap((item) =>
      item.kind === "private" && item.access.state === "granted"
        ? [Date.parse(item.access.expiresAt)]
        : [],
    );
    if (!expires.length) return null;
    const checked = Date.parse(content.checkedAt);
    const end = Math.min(...expires);
    return Number.isFinite(checked) &&
      Number.isFinite(end) &&
      Number.isFinite(content.clientRequestStartedAt) &&
      content.clientRequestStartedAt > 0
      ? content.clientRequestStartedAt + end - checked
      : 0;
  }, [query.data]);
  useEffect(() => {
    if (deadline === null || !query.data) return;
    const version = query.data.checkedAt;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      const remaining = deadline! - Date.now();
      if (remaining > 0) {
        timer = setTimeout(schedule, Math.min(remaining, 2147483647));
        return;
      }
      setExpiredVersion(version);
      void clearContentData().then(() => query.refetch());
    }
    schedule();
    return () => clearTimeout(timer);
  }, [deadline, query.data?.checkedAt, clearContentData, query.refetch]);
  useEffect(
    () => () => {
      // Another mounted consumer of this article owns its still-valid result.
      void Promise.resolve().then(async () => {
        const unused = queryClient
          .getQueryCache()
          .findAll(contentFilter)
          .filter((cached) => cached.getObserversCount() === 0);
        for (const cached of unused) {
          await queryClient.cancelQueries({
            queryKey: cached.queryKey,
            exact: true,
          });
          if (cached.getObserversCount() === 0)
            cached.setState({ data: undefined, dataUpdatedAt: 0 });
        }
      });
    },
    [queryClient, contentFilter],
  );
  const retry = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);
  const denied =
    query.error &&
    [401, 403].includes((query.error as { status?: number }).status ?? 0);
  const expired =
    !!query.data &&
    (expiredVersion === query.data.checkedAt ||
      (deadline !== null && Date.now() >= deadline));
  return (
    <ChildComponent
      isServer={false}
      variant={props.variant}
      blogModuleArticle={props.blogModuleArticle}
      language={props.language}
      className={props.className}
      data={props.data}
      queryScopePrefix={`${partition.principal || props.data.id}:${props.blogModuleArticle.id}:${readerId}`}
      content={denied ? undefined : query.data}
      state={
        query.error
          ? "error"
          : expired
            ? "expired"
            : query.data
              ? "ready"
              : "checking"
      }
      onRetry={retry}
    />
  );
}
