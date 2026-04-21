import { api as notificationWidgetApi } from "@sps/notification/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const notificationAdapter = createModuleAdapter({
  module: "notification",
  loadEntityServer: async ({ externalWidgetId }) =>
    notificationWidgetApi
      .findById({ id: externalWidgetId })
      .catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/notification/Component"
      ),
  ),
});
