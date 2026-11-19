import { createService as createOrder } from "@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap";
import { createService as createOrders } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/bootstrap";
import { createService as createProducts } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/bootstrap";
import { Service as RoleRevocation } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/startup/ecommerce/order/role-revocation";
import type { IAppAssembly } from "@sps/shared-backend-api";

export function createRoleRevocation(assembly: IAppAssembly) {
  return new RoleRevocation({
    get subjectsToEcommerceModuleOrders() {
      return createOrders(assembly);
    },
    get rolesToEcommerceModuleProducts() {
      return createProducts(assembly);
    },
    get order() {
      return createOrder(assembly);
    },
  });
}
