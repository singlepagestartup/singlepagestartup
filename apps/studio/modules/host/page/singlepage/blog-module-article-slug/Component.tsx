import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { Component as Layout } from "../../../layout/index";
import { Component as Widget } from "../../../widget/index";

export function BlogFindByIdArticleOverview({
  variant = "blog-module-article-slug",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout variant="website" footer="compact">
        <main
          className="min-w-0"
          data-ds-page="host.page.blog-module-article-slug"
          data-ds-route="/blog/articles/[blog.articles.slug]"
        >
          <Widget variant="default" />
        </main>
      </Layout>
    </div>
  );
}
