import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as BlogModuleWidget } from "../../../../blog/widget";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="blog-module-category-slug"
    >
      <Layout variant="website" activeHref="/blog" footer="compact">
        <main>
          <BlogModuleWidget variant="category-overview-default" />
        </main>
      </Layout>
    </div>
  );
}
