import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
export function Component({ access = "locked" }: IComponentProps) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-article-private-slug"
    >
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main>
          <BlogModuleWidget
            variant="article-overview-with-private-content-default"
            access={access}
          />
        </main>
      </Layout>
    </div>
  );
}
