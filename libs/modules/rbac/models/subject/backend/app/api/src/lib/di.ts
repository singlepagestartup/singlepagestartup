export const SubjectDI = {
  ISubjectsToRolesService: Symbol.for("rbac.subject.subjects-to-roles.service"),
  ISubjectsToIdentitiesService: Symbol.for(
    "rbac.subject.subjects-to-identities.service",
  ),
  ISubjectsToSocialModuleProfilesService: Symbol.for(
    "rbac.subject.subjects-to-social-module-profiles.service",
  ),
  ISubjectsToEcommerceModuleOrdersService: Symbol.for(
    "rbac.subject.subjects-to-ecommerce-module-orders.service",
  ),
  ISubjectsToBillingModuleCurrenciesService: Symbol.for(
    "rbac.subject.subjects-to-billing-module-currencies.service",
  ),
  IIsAuthorizedService: Symbol.for("rbac.subject.is-authorized.service"),
  IBillRouteService: Symbol.for("rbac.subject.bill-route.service"),
  IEcommerceOrderProceedService: Symbol.for(
    "rbac.subject.ecommerce-order-proceed.service",
  ),
};
