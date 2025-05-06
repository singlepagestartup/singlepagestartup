import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";
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
      data-module="blog"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
      <Card className="w-full flex flex-col gap-3">
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
            <CategoriesToArticles
              isServer={props.isServer}
              variant="find"
              apiProps={{
                params: {
                  filters: {
                    and: [
                      {
                        column: "categoryId",
                        method: "eq",
                        value: props.data?.id,
                      },
                    ],
                  },
                },
              }}
            >
              {({ data }) => {
                return data?.map((categoryToArticle, index) => {
                  return (
                    <CategoriesToArticles
                      key={index}
                      isServer={props.isServer}
                      variant={categoryToArticle.variant as any}
                      data={categoryToArticle}
                      language={props.language}
                    />
                  );
                });
              }}
            </CategoriesToArticles>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
