import type { IComponentProps } from "./interface";
import BlogCategory from "../framework/Blog/Category";
import { resolveFrameworkLink } from "../framework/navigation";
export function Component({ categorySlug = "frontend" }: IComponentProps = {}) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-category-slug"
    >
      <BlogCategory
        navigationHref={`/blog/categories/${encodeURIComponent(categorySlug)}`}
        resolveLink={resolveFrameworkLink}
      />
    </div>
  );
}
