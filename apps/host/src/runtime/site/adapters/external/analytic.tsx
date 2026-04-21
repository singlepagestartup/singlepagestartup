import { api as analyticWidgetApi } from "@sps/analytic/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const analyticAdapter = createModuleAdapter({
  module: "analytic",
  loadEntityServer: async ({ externalWidgetId }) =>
    analyticWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/analytic/Component"
      ),
  ),
});
