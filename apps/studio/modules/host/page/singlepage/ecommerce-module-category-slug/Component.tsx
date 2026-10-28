import type { IComponentProps } from "./interface";
import { Component as Layout } from "../../../layout";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget";
export function Component(props: IComponentProps) {
  return (
    <div
      data-module="host"
      data-model="page"
      data-variant="ecommerce-module-category-slug"
    >
      <Layout
        variant="website"
        activeHref="/ecommerce/products"
        footer="compact"
      >
        <main>
          <EcommerceModuleWidget variant="category-overview-default" />
        </main>
      </Layout>
    </div>
  );
}
