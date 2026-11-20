import type { IAppAssembly } from "@sps/shared-backend-api";
import { createService as createFunnelService } from "@sps/crm/models/funnel/backend/app/api/src/lib/bootstrap";
import { createService as createPublicationService } from "@sps/crm/models/funnel-publication/backend/app/api/src/lib/bootstrap";
import { createService as createTaskEventService } from "@sps/crm/models/task-event/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToFunnelPublicationsService } from "@sps/crm/relations/tasks-to-funnel-publications/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToTaskEventsService } from "@sps/crm/relations/tasks-to-task-events/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToEcommerceModuleProductsService } from "@sps/crm/relations/tasks-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToEcommerceModuleStoresToProductsService } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/app/api/src/lib/bootstrap";
import { createService as createTasksToEcommerceModuleOrdersService } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";

export function createModule(assembly: IAppAssembly) {
  return {
    get funnel() {
      return createFunnelService(assembly);
    },
    get funnelPublication() {
      return createPublicationService(assembly);
    },
    get taskEvent() {
      return createTaskEventService(assembly);
    },
    get tasksToFunnelPublications() {
      return createTasksToFunnelPublicationsService(assembly);
    },
    get tasksToTaskEvents() {
      return createTasksToTaskEventsService(assembly);
    },
    get tasksToEcommerceModuleProducts() {
      return createTasksToEcommerceModuleProductsService(assembly);
    },
    get tasksToEcommerceModuleStoresToProducts() {
      return createTasksToEcommerceModuleStoresToProductsService(assembly);
    },
    get tasksToEcommerceModuleOrders() {
      return createTasksToEcommerceModuleOrdersService(assembly);
    },
  };
}
