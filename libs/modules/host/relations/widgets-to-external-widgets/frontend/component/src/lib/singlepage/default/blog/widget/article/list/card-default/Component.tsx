import { Component as BlogModuleArticle } from "@sps/blog/models/article/frontend/component";
import { Component as BlogModuleWidgetsToArticles } from "@sps/blog/relations/widgets-to-articles/frontend/component";
import { IComponentProps } from "./interface";

export function Component(props: IComponentProps) {
  return (
    <BlogModuleWidgetsToArticles
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
        return (
          <BlogModuleArticle isServer={props.isServer} variant="find">
            {({ data }) => {
              return data?.map((entity, index) => {
                if (widgetsToArticles?.length) {
                  const widgetToArticle = widgetsToArticles.find(
                    (widgetToArticle) =>
                      widgetToArticle.articleId === entity.id,
                  );

                  if (widgetToArticle) {
                    return (
                      <BlogModuleArticle
                        key={index}
                        isServer={props.isServer}
                        variant="card-default"
                        data={entity}
                        language={props.language}
                      />
                    );
                  }

                  return null;
                }

                return (
                  <BlogModuleArticle
                    key={index}
                    isServer={props.isServer}
                    variant="card-default"
                    data={entity}
                    language={props.language}
                  />
                );
              });
            }}
          </BlogModuleArticle>
        );
      }}
    </BlogModuleWidgetsToArticles>
  );
}
