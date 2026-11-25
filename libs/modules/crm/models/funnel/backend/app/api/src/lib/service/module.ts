import type { IAppAssembly } from "@sps/shared-backend-api";
import { createService as createFormService } from "@sps/crm/models/form/backend/app/api/src/lib/bootstrap";
import { createService as createFunnelTaskService } from "@sps/crm/relations/funnels-to-tasks/backend/app/api/src/lib/bootstrap";

import { createService as createTaskStageService } from "@sps/crm/relations/tasks-to-stages/backend/app/api/src/lib/bootstrap";

export function createModule(assembly: IAppAssembly) {
  return {
    get tasksToStages() {
      return createTaskStageService(assembly);
    },
    get funnelsToTasks() {
      return createFunnelTaskService(assembly);
    },
    get form() {
      return createFormService(assembly);
    },
  };
}
