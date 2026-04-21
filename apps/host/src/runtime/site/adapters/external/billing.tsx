import { api as billingWidgetApi } from "@sps/billing/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const billingAdapter = createModuleAdapter({
  module: "billing",
  loadEntityServer: async ({ externalWidgetId }) =>
    billingWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/billing/Component"
      ),
  ),
});
