import { api as blogWidgetApi } from "@sps/blog/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const blogAdapter = createModuleAdapter({
  module: "blog",
  loadEntityServer: async ({ externalWidgetId }) =>
    blogWidgetApi.findById({ id: externalWidgetId }).catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/blog/Component"
      ),
  ),
});
