import { api as websiteBuilderWidgetApi } from "@sps/website-builder/models/widget/sdk/server";
import type { IModel as WebsiteBuilderWidgetModel } from "@sps/website-builder/models/widget/sdk/model";

import { ExternalWidgetAdapter } from "../../types";
import { renderWebsiteBuilderWidget } from "../../modules/website-builder";
import { renderModuleComponent } from "./factory";

export const websiteBuilderAdapter: ExternalWidgetAdapter<WebsiteBuilderWidgetModel> =
  {
    module: "website-builder",
    loadEntityServer: async ({ externalWidgetId }) =>
      websiteBuilderWidgetApi
        .findById({ id: externalWidgetId })
        .catch(() => undefined),
    supportsVariant: (variant) => Boolean(variant),
    async renderServer({ context, entity, relation }) {
      if (
        entity.variant === "content-default" ||
        entity.variant === "footer-default" ||
        entity.variant === "navbar-default"
      ) {
        return renderWebsiteBuilderWidget(entity, context);
      }

      return renderModuleComponent(
        () =>
          import(
            "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component"
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
