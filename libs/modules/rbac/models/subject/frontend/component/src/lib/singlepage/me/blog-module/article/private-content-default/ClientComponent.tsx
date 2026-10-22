"use client";
import { Component as BlogModuleArticle } from "@sps/blog/models/article/frontend/component";
import { Component as WebsiteBuilderModuleWidget } from "@sps/website-builder/models/widget/frontend/component";
import { ProtectedMediaProvider } from "@sps/file-storage/models/file/frontend/component";
import { QueryScopeProvider } from "@sps/shared-frontend-client-api";
import type { IClientComponentProps } from "./interface";
export function Component(props: IClientComponentProps) {
  if (props.state === "checking" || (props.state === "error" && !props.content))
    return (
      <BlogModuleArticle
        isServer={false}
        variant="private-content-default"
        language={props.language}
        access={props.state}
        onRetry={props.onRetry}
      />
    );
  return (
    <div
      className="space-y-8"
      data-article-content={props.blogModuleArticle.id}
    >
      {props.content?.items.map((item) => {
        if (item.kind === "public")
          return (
            <WebsiteBuilderModuleWidget
              key={item.key}
              isServer={false}
              variant={item.widget.variant as any}
              dataSource="props"
              data={item.widget}
              language={props.language}
            />
          );
        const granted =
          props.state === "ready" && item.access.state === "granted";
        const access =
          props.state === "error"
            ? "error"
            : granted
              ? "granted"
              : props.state === "expired"
                ? "expired"
                : item.access.state;
        const scopeKey = `${props.queryScopePrefix}:${item.key}`;
        return (
          <BlogModuleArticle
            key={item.key}
            isServer={false}
            variant="private-content-default"
            language={props.language}
            access={access}
            actionHref={
              access === "guest"
                ? `/${props.language}/rbac/subjects/me/authentication/select-method`
                : `/${props.language}/ecommerce/products`
            }
            onRetry={props.onRetry}
          >
            {granted && item.access.state === "granted" && "widget" in item ? (
              <QueryScopeProvider key={scopeKey} scopeKey={scopeKey}>
                <ProtectedMediaProvider scopeKey={scopeKey}>
                  <WebsiteBuilderModuleWidget
                    isServer={false}
                    variant={item.widget.variant as any}
                    dataSource="props"
                    data={item.widget}
                    language={props.language}
                  />
                </ProtectedMediaProvider>
              </QueryScopeProvider>
            ) : null}
          </BlogModuleArticle>
        );
      })}
    </div>
  );
}
