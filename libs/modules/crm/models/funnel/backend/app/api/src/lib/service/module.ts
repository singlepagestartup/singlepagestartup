import type { IAppAssembly } from "@sps/shared-backend-api";
import { createService as createFormService } from "@sps/crm/models/form/backend/app/api/src/lib/bootstrap";
import { createService as createPublicationService } from "@sps/crm/models/funnel-publication/backend/app/api/src/lib/bootstrap";
import { createService as createFunnelsToEcommerceModuleStoresService } from "@sps/crm/relations/funnels-to-ecommerce-module-stores/backend/app/api/src/lib/bootstrap";
import { createService as createFunnelsToFunnelPublicationsService } from "@sps/crm/relations/funnels-to-funnel-publications/backend/app/api/src/lib/bootstrap";

export function createModule(assembly: IAppAssembly) {
  return {
    get form() {
      return createFormService(assembly);
    },
    get funnelPublication() {
      return createPublicationService(assembly);
    },
    get funnelsToEcommerceModuleStores() {
      return createFunnelsToEcommerceModuleStoresService(assembly);
    },
    get funnelsToFunnelPublications() {
      return createFunnelsToFunnelPublicationsService(assembly);
    },
  };
}
