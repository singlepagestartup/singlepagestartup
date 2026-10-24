import { frameworkArticlePreviews } from "../../../article";
import type { IComponentProps } from "./interface";
import { Component as ClientComponent } from "./ClientComponent";
export function ArticleFindCardDefault(props: IComponentProps = {}) {
  const p = { ...defaultArticleFindCardDefaultProps, ...props };
  return (
    <ClientComponent
      categories={p.categories}
      articles={p.articles}
      embedded={props.embedded}
      title={props.title}
      description={props.description}
      pageSize={props.pageSize}
    />
  );
}
export const defaultArticleFindCardDefaultProps = {
  categories: [
    { slug: "all", label: "All articles", count: 6 },
    { slug: "frontend", label: "Frontend", count: 2 },
    { slug: "backend", label: "Backend", count: 2 },
    { slug: "devops", label: "DevOps", count: 2 },
  ] as BlogCategoryTab[],
  articles: frameworkArticlePreviews,
};
import type { BlogCategoryTab } from "./interface";
