import {
  prepareModuleWidgetCutover,
  runWidgetCutoverCli,
} from "./module-widget-links";
import type { IWidgetCutoverAdapter } from "./ai-chat-widget-links";
export interface ICommerceWidgetInput {
  targets: { hostLinkId: string; ecommerceWidgetId: string }[];
}
export async function prepareCommerceWidgetCutover(
  input: ICommerceWidgetInput,
  adapter: IWidgetCutoverAdapter,
) {
  return prepareModuleWidgetCutover(
    {
      sourceModule: "ecommerce",
      schema: "sps.ecommerce-widget-cutover.v1",
      slugPrefix: "commerce",
      presentationVariant: "content-ecommerce-default",
      variants: {
        "product-list-default":
          "subject-me-ecommerce-module-product-list-default",
        "product-overview-default":
          "subject-me-ecommerce-module-product-overview-default",
        "category-overview-default":
          "subject-me-ecommerce-module-category-overview-default",
        "store-overview-default":
          "subject-me-ecommerce-module-store-overview-default",
      },
    },
    {
      targets: input.targets.map((t) => ({
        hostLinkId: t.hostLinkId,
        sourceWidgetId: t.ecommerceWidgetId,
      })),
    },
    adapter,
  );
}
if (import.meta.main)
  runWidgetCutoverCli(
    "sps.ecommerce-widget-cutover.v1",
    prepareCommerceWidgetCutover,
  ).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
