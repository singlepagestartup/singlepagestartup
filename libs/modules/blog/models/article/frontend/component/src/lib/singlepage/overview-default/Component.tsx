import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as ArticlesToWebsiteBuilderModuleWidgets } from "@sps/blog/relations/articles-to-website-builder-module-widgets/frontend/component";
import { Card, CardContent, CardHeader, TipTap } from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-model="article"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn(
        "w-full flex flex-col",
        props.data.className,
        props.className,
      )}
    >
      <Card className="w-full flex flex-col gap-3">
        <CardHeader>
          {props.data.title ? (
            <h1 className="text-2xl font-semibold leading-none tracking-tight">
              {props.data.title?.[props.language]}
            </h1>
          ) : null}
        </CardHeader>
        <CardContent>
          {props.data.description?.[props.language] ? (
            <TipTap value={props.data.description[props.language] || ""} />
          ) : null}
          <ArticlesToWebsiteBuilderModuleWidgets
            isServer={props.isServer}
            variant="find"
            apiProps={{
              params: {
                filters: {
                  and: [
                    {
                      column: "articleId",
                      method: "eq",
                      value: props.data.id,
                    },
                  ],
                },
              },
            }}
          >
            {({ data }) => {
              return data?.map((entity, index) => {
                return (
                  <ArticlesToWebsiteBuilderModuleWidgets
                    key={entity.id}
                    isServer={props.isServer}
                    variant={entity.variant as any}
                    data={entity}
                    language={props.language}
                  />
                );
              });
            }}
          </ArticlesToWebsiteBuilderModuleWidgets>
        </CardContent>
      </Card>
    </div>
  );
}
