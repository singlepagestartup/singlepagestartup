import { api as rbacWidgetApi } from "@sps/rbac/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const rbacAdapter = createModuleAdapter({
  module: "rbac",
  loadEntityServer: async ({ externalWidgetId }) =>
    rbacWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/Component"
      ),
  ),
});
