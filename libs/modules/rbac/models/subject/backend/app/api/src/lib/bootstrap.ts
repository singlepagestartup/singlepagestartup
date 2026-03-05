import { Container, ContainerModule, interfaces } from "inversify";
import {
  DI,
  ExceptionFilter,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import { Configuration } from "./configuration";
import { Repository } from "./repository";
import { Controller } from "./controller";
import { Service } from "./service";
import { App } from "./app";
import { SubjectDI } from "./di";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Repository as SubjectsToRolesRepository } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToRolesConfiguration } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/configuration";
import { Service as IsAuthorizedService } from "./service/singlepage/is-authorized";
import { Service as SubjectsToBillingModuleCurrenciesService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Repository as SubjectsToBillingModuleCurrenciesRepository } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToBillingModuleCurrenciesConfiguration } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/configuration";
import { Service as BillRouteService } from "./service/singlepage/bill-route";
import { Service as EcommerceOrderProceedService } from "./service/singlepage/ecommerce/order/proceed";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Repository as SubjectsToIdentitiesRepository } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToIdentitiesConfiguration } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/configuration";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { Repository as SubjectsToSocialModuleProfilesRepository } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToSocialModuleProfilesConfiguration } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/configuration";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import { Repository as SubjectsToEcommerceModuleOrdersRepository } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/repository";
import { Configuration as SubjectsToEcommerceModuleOrdersConfiguration } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/configuration";

const bindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter);
  bind<App>(DI.IApp).to(App);
  bind<Controller>(DI.IController).to(Controller);
  bind<Repository>(DI.IRepository).to(Repository);
  bind<Service>(DI.IService).to(Service);
  bind<Configuration>(DI.IConfiguration).to(Configuration);
  bind<SubjectsToRolesService>(SubjectDI.ISubjectsToRolesService)
    .toDynamicValue(
      () =>
        new SubjectsToRolesService(
          new SubjectsToRolesRepository(new SubjectsToRolesConfiguration()),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToIdentitiesService>(SubjectDI.ISubjectsToIdentitiesService)
    .toDynamicValue(
      () =>
        new SubjectsToIdentitiesService(
          new SubjectsToIdentitiesRepository(
            new SubjectsToIdentitiesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToSocialModuleProfilesService>(
    SubjectDI.ISubjectsToSocialModuleProfilesService,
  )
    .toDynamicValue(
      () =>
        new SubjectsToSocialModuleProfilesService(
          new SubjectsToSocialModuleProfilesRepository(
            new SubjectsToSocialModuleProfilesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToEcommerceModuleOrdersService>(
    SubjectDI.ISubjectsToEcommerceModuleOrdersService,
  )
    .toDynamicValue(
      () =>
        new SubjectsToEcommerceModuleOrdersService(
          new SubjectsToEcommerceModuleOrdersRepository(
            new SubjectsToEcommerceModuleOrdersConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<SubjectsToBillingModuleCurrenciesService>(
    SubjectDI.ISubjectsToBillingModuleCurrenciesService,
  )
    .toDynamicValue(
      () =>
        new SubjectsToBillingModuleCurrenciesService(
          new SubjectsToBillingModuleCurrenciesRepository(
            new SubjectsToBillingModuleCurrenciesConfiguration(),
          ),
        ),
    )
    .inSingletonScope();
  bind<IsAuthorizedService>(SubjectDI.IIsAuthorizedService)
    .to(IsAuthorizedService)
    .inSingletonScope();
  bind<BillRouteService>(SubjectDI.IBillRouteService)
    .to(BillRouteService)
    .inSingletonScope();
  bind<EcommerceOrderProceedService>(SubjectDI.IEcommerceOrderProceedService)
    .to(EcommerceOrderProceedService)
    .inSingletonScope();
});

export async function bootstrap() {
  const container = new Container({
    skipBaseClassChecks: true,
  });
  container.load(bindings);
  const app = container.get<App>(DI.IApp);
  await app.init();

  return { app };
}
