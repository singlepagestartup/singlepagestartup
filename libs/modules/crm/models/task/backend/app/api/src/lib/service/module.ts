import type { IAppAssembly } from "@sps/shared-backend-api";
import { createService as createFunnelService } from "@sps/crm/models/funnel/backend/app/api/src/lib/bootstrap";
import { createService as createTaskStageService } from "@sps/crm/relations/tasks-to-stages/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToEcommerceModuleStoresToProductsService } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToEcommerceModuleOrdersService } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";

export function createModule(assembly: IAppAssembly) {
  return {
    get funnel() {
      return createFunnelService(assembly);
    },
    get tasksToStages() {
      return createTaskStageService(assembly);
    },
    get tasksToEcommerceModuleStoresToProducts() {
      return createTasksToEcommerceModuleStoresToProductsService(assembly);
    },
    get tasksToEcommerceModuleOrders() {
      return createTasksToEcommerceModuleOrdersService(assembly);
    },
  };
}
