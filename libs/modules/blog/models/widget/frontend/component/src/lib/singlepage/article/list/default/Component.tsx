import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import { Component as WidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TipTap,
} from "@sps/shared-ui-shadcn";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="startup"
      data-model="widget"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex", props.data.className, props.className)}
    >
      <Card className="w-full max-w-7xl mx-auto flex flex-col gap-3">
        <CardHeader>
          {props.data.title ? (
            <CardTitle>{props.data.title?.[props.language]}</CardTitle>
          ) : null}
          {props.data.description?.[props.language] ? (
            <TipTap value={props.data.description[props.language] || ""} />
          ) : null}
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-12">
            <WidgetsToArticles
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "widgetId",
                        method: "eq",
                        value: props.data.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data: widgetsToArticles }) => {
                if (widgetsToArticles?.length) {
                  return widgetsToArticles.map((widgetToArticle, index) => {
                    return (
                      <WidgetsToArticles
                        key={index}
                        isServer={props.isServer}
                        variant={widgetToArticle.variant as any}
                        data={widgetToArticle}
                        language={props.language}
                      />
                    );
                  });
                }

                return (
                  <Article isServer={props.isServer} variant="find">
                    {({ data }) => {
                      return data?.map((article, index) => {
                        return (
                          <Article
                            key={index}
                            isServer={props.isServer}
                            variant={article.variant as any}
                            data={article}
                            language={props.language}
                          />
                        );
                      });
                    }}
                  </Article>
                );
              }}
            </WidgetsToArticles>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
