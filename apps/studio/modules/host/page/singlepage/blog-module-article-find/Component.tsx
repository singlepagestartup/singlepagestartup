import type { IComponentProps } from "./interface";
import BlogIndex from "../framework/Blog";
import { resolveFrameworkLink } from "../framework/navigation";
export function BlogFindArticleCard(_props: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-article-find"
    >
      <BlogIndex resolveLink={resolveFrameworkLink} />
    </div>
  );
}
