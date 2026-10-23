import { notFound } from "next/navigation";
import { Component as Article } from "@sps/blog/models/article/frontend/component";
import type { IContentProps } from "./interface";
export function Component(props: IContentProps) {
  const data = props.articleSlug;
  if (!data) return null;
  return (
    <Article
      isServer={props.isServer}
      variant="find"
      apiProps={{
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: data,
              },
            ],
          },
        },
      }}
    >
      {({ data }) => {
        if (data?.length === 0) notFound();
        return data?.map((entity, index) => {
          return (
            <Article
              key={entity.id}
              isServer={props.isServer}
              variant="overview-with-private-content-default"
              dataSource="props"
              data={entity}
              language={props.language}
              author={props.renderAuthor?.({
                data: entity,
                size: "sm",
                inverse: true,
              })}
            >
              {(props.renderContent ?? props.renderPrivateContent)?.({
                data: entity,
              })}
            </Article>
          );
        });
      }}
    </Article>
  );
}
