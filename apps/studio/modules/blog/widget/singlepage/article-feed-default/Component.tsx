import type { IComponentProps } from "./interface";
import { ArticleFindCardDefault } from "../article-find-card-default/Component";
import { Skeleton } from "../article-find-card-default/Skeleton";
export function Component(props: IComponentProps) {
  if (props.loading) return <Skeleton />;
  return (
    <div
      data-module="blog"
      data-model="widget"
      data-variant="article-feed-default"
      data-ds-block="blog.widget.article-feed-default"
      data-ds-layer="singlepage"
    >
      <ArticleFindCardDefault
        title="The Framework journal"
        {...(props.empty ? { articles: [] } : {})}
      />
    </div>
  );
}
