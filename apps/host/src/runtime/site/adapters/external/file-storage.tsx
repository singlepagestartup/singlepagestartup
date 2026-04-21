import { api as fileStorageWidgetApi } from "@sps/file-storage/models/widget/sdk/server";

import { componentFromModule, createModuleAdapter } from "./factory";

export const fileStorageAdapter = createModuleAdapter({
  module: "file-storage",
  loadEntityServer: async ({ externalWidgetId }) =>
    fileStorageWidgetApi
      .findById({ id: externalWidgetId })
      .catch(() => undefined),
  loadRenderer: componentFromModule(
    () =>
      import(
        "@sps/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/file-storage/Component"
      ),
  ),
});
