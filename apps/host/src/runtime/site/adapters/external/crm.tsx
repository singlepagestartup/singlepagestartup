import { api as crmWidgetApi } from "@sps/crm/models/widget/sdk/server";
import type { IModel as CrmWidgetModel } from "@sps/crm/models/widget/sdk/model";

import { ExternalWidgetAdapter } from "../../types";
import { renderCrmWidget } from "../../modules/crm";
import { renderModuleComponent } from "./factory";

export const crmAdapter: ExternalWidgetAdapter<CrmWidgetModel> = {
  module: "crm",
  loadEntityServer: async ({ externalWidgetId }) =>
    crmWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  supportsVariant: (variant) => Boolean(variant),
  async renderServer({ context, entity, relation }) {
    if (entity.variant === "form-list-default") {
      return renderCrmWidget(entity, context);
    }

    return renderModuleComponent(
      () =>
        import(
          "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/crm/Component"
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
