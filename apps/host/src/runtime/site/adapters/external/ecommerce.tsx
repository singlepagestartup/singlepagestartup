import { api as ecommerceWidgetApi } from "@sps/ecommerce/models/widget/sdk/server";
import type { IModel as EcommerceWidgetModel } from "@sps/ecommerce/models/widget/sdk/model";

import { ExternalWidgetAdapter } from "../../types";
import { renderEcommerceWidget } from "../../modules/ecommerce";
import { renderModuleComponent } from "./factory";

export const ecommerceAdapter: ExternalWidgetAdapter<EcommerceWidgetModel> = {
  module: "ecommerce",
  loadEntityServer: async ({ externalWidgetId }) =>
    ecommerceWidgetApi
      .findById({ id: externalWidgetId })
      .catch(() => undefined),
  supportsVariant: (variant) => Boolean(variant),
  async renderServer({ context, entity, relation }) {
    if (
      entity.variant === "category-list-default" ||
      entity.variant === "product-list-default"
    ) {
      return renderEcommerceWidget(entity, context);
    }

    return renderModuleComponent(
      () =>
        import(
          "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/Component"
        ),
      {
        data: relation,
        isServer: true,
        language: context.language,
        url: context.url,
        variant: relation.variant,
      },
    );
  },
};
