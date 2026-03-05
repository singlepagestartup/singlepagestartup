export const SubjectDI = {
  ISubjectsToRolesService: Symbol.for("rbac.subject.subjects-to-roles.service"),
  ISubjectsToBillingModuleCurrenciesService: Symbol.for(
    "rbac.subject.subjects-to-billing-module-currencies.service",
  ),
  IIsAuthorizedService: Symbol.for("rbac.subject.is-authorized.service"),
  IBillRouteService: Symbol.for("rbac.subject.bill-route.service"),
};
