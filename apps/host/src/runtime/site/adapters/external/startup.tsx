import { api as startupWidgetApi } from "@sps/startup/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const startupAdapter = createModuleAdapter({
  module: "startup",
  loadEntityServer: async ({ externalWidgetId }) =>
    startupWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/startup/Component"
      ),
  ),
});
