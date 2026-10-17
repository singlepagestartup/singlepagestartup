import type { IComponentProps, IComponentVariantProps } from "./interface";
export type { IComponentVariantProps } from "./interface";
import { ReactNode as ReactNode } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as Layout } from "../../../layout/index";
import { Component as WebsiteBuilderModuleWidget } from "../../../../website-builder/widget/index";
import { Component as EcommerceModuleWidget } from "../../../../ecommerce/widget/index";
interface SectionStackProps {
  children: ReactNode;
  className?: string;
}
function SectionStack({ children, className }: SectionStackProps) {
  return (
    <div
      className={twMerge(
        "flex min-w-0 w-full flex-col gap-6 py-6 sm:gap-8 sm:py-8 [&>[data-ds-block]]:py-0 [&>[data-ds-section]]:py-0 [&>section]:py-0",
        className,
      )}
      data-ds-layout="section-stack"
    >
      {children}
    </div>
  );
}

export function EcommerceProductFindCard({
  variant = "ecommerce-module-product-find",
}: IComponentProps = {}) {
  return (
    <div data-module="host" data-model="page" data-variant={variant}>
      <Layout
        variant="website"
        activeHref="/ecommerce/products"
        footer="compact"
      >
        <main
          className="min-w-0"
          data-ds-page="host.page.ecommerce-module-product-find"
          data-ds-route="/ecommerce/products"
        >
          <SectionStack>
            <WebsiteBuilderModuleWidget variant="content-page-header" />
            <EcommerceModuleWidget variant="product-find-card" />
          </SectionStack>
        </main>
      </Layout>
    </div>
  );
}
