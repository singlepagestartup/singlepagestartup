export const SubjectDI = {
  IEcommerceCatalogService: Symbol.for(
    "rbac.subject.ecommerce-catalog.service",
  ),
  ISecurityNotificationsService: Symbol.for(
    "rbac.subject.security-notifications.service",
  ),
  IIsAuthorizedService: Symbol.for("rbac.subject.is-authorized.service"),
  IEcommerceOrderProceedService: Symbol.for(
    "rbac.subject.ecommerce-order-proceed.service",
  ),
};
