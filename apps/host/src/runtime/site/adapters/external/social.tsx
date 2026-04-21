import { api as socialWidgetApi } from "@sps/social/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const socialAdapter = createModuleAdapter({
  module: "social",
  loadEntityServer: async ({ externalWidgetId }) =>
    socialWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/social/Component"
      ),
  ),
});
