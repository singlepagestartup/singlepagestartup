import { IComponentPropsExtended } from "./interface";
import { cn } from "@sps/shared-frontend-client-utils";
import { Component as CategoriesToArticles } from "@sps/blog/relations/categories-to-articles/frontend/component";

export function Component(props: IComponentPropsExtended) {
  return (
    <div
      data-module="blog"
      data-model="category"
      data-id={props.data?.id || ""}
      data-variant={props.variant}
      className={cn("w-full flex flex-col", props.className)}
    >
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
  );
}
