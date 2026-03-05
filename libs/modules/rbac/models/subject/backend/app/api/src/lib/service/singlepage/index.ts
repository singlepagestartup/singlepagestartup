import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Repository } from "../../repository";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service as Logout } from "./logout";
import {
  Service as Refresh,
  IExecuteProps as IRefreshExecuteProps,
} from "./refresh";
import {
  Service as AuthenticationEmailAndPassword,
  IExecuteProps as IAuthenticationEmailAndPasswordExecuteProps,
} from "./authentication/email-and-password";
import {
  Service as IsAuthorized,
  IExecuteProps as IIsAuthorizedExecuteProps,
} from "./is-authorized";
import {
  Service as AuthenticationEthereumVirtualMachine,
  IExecuteProps as IAuthenticationEthereumVirtualMachineExecuteProps,
} from "./authentication/ethereum-virtual-machine";
import {
  Service as AuthenticationOAuthStart,
  IExecuteProps as IAuthenticationOAuthStartExecuteProps,
} from "./authentication/oauth/start";
import {
  Service as AuthenticationOAuthCallback,
  IExecuteProps as IAuthenticationOAuthCallbackExecuteProps,
} from "./authentication/oauth/callback";
import {
  Service as AuthenticationOAuthExchange,
  IExecuteProps as IAuthenticationOAuthExchangeExecuteProps,
} from "./authentication/oauth/exchange";
import {
  Service as DeleteAnonymousSubjects,
  IExecuteProps as IDeleteAnonymousSubjectsExecuteProps,
} from "./delete-anonymous-subjects";
import {
  Service as Deanonymize,
  IExecuteProps as IDeanonymizeExecuteProps,
} from "./deanonymize";
import {
  Service as EcommerceOrderCheckout,
  IExecuteProps as IEcommerceOrderCheckoutExecuteProps,
} from "./ecommerce/order/checkout";
import {
  Service as ChatSubjectsWithSocialModuleProfiles,
  IExecuteProps as IChatSubjectsWithSocialModuleProfilesProps,
} from "./social-module/chat-subjects-with-social-module-profiles";
import {
  Service as BillRoute,
  IExecuteProps as IBillRouteProps,
} from "./bill-route";
import {
  Service as EcommerceOrderProceed,
  IExecuteProps as IEcommerceOrderProceedProps,
} from "./ecommerce/order/proceed";
import { SubjectDI } from "../../di";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import {
  Service as TelegramBootstrap,
  IExecuteProps as ITelegramBootstrapExecuteProps,
  IResult as ITelegramBootstrapResult,
} from "./telegram/bootstrap";
import {
  Service as TelegramSyncMembership,
  IExecuteProps as ITelegramSyncMembershipExecuteProps,
  IResult as ITelegramSyncMembershipResult,
} from "./telegram/sync-membership";
import {
  Service as TelegramCheckoutFreeSubscription,
  IExecuteProps as ITelegramCheckoutFreeSubscriptionExecuteProps,
} from "./telegram/checkout-free-subscription";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  isAuthorizedService: IsAuthorized;
  billRouteService: BillRoute;
  ecommerceOrderProceedService: EcommerceOrderProceed;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  subjectsToRoles: SubjectsToRolesService;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(SubjectDI.IIsAuthorizedService)
    isAuthorizedService: IsAuthorized,
    @inject(SubjectDI.IBillRouteService)
    billRouteService: BillRoute,
    @inject(SubjectDI.IEcommerceOrderProceedService)
    ecommerceOrderProceedService: EcommerceOrderProceed,
    @inject(SubjectDI.ISubjectsToIdentitiesService)
    subjectsToIdentities: SubjectsToIdentitiesService,
    @inject(SubjectDI.ISubjectsToSocialModuleProfilesService)
    subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService,
    @inject(SubjectDI.ISubjectsToRolesService)
    subjectsToRoles: SubjectsToRolesService,
    @inject(SubjectDI.ISubjectsToEcommerceModuleOrdersService)
    subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService,
  ) {
    super(repository);
    this.isAuthorizedService = isAuthorizedService;
    this.billRouteService = billRouteService;
    this.ecommerceOrderProceedService = ecommerceOrderProceedService;
    this.subjectsToIdentities = subjectsToIdentities;
    this.subjectsToSocialModuleProfiles = subjectsToSocialModuleProfiles;
    this.subjectsToRoles = subjectsToRoles;
    this.subjectsToEcommerceModuleOrders = subjectsToEcommerceModuleOrders;
  }

  async isAuthorized(props: IIsAuthorizedExecuteProps): Promise<any> {
    return this.isAuthorizedService.execute(props);
  }

  async logout(): Promise<any> {
    return new Logout(this.repository).execute();
  }

  async refresh(props: IRefreshExecuteProps) {
    return new Refresh(this.repository).execute(props);
  }

  async authenticationLoginAndPassowrd(
    props: IAuthenticationEmailAndPasswordExecuteProps,
  ) {
    return new AuthenticationEmailAndPassword(this.repository).execute(props);
  }

  async authenticationEthereumVirtualMachine(
    props: IAuthenticationEthereumVirtualMachineExecuteProps,
  ) {
    return new AuthenticationEthereumVirtualMachine(this.repository).execute(
      props,
    );
  }

  async authenticationOAuthStart(props: IAuthenticationOAuthStartExecuteProps) {
    return new AuthenticationOAuthStart(this.repository).execute(props);
  }

  async authenticationOAuthCallback(
    props: IAuthenticationOAuthCallbackExecuteProps,
  ) {
    return new AuthenticationOAuthCallback(this.repository).execute(props);
  }

  async authenticationOAuthExchange(
    props: IAuthenticationOAuthExchangeExecuteProps,
  ) {
    return new AuthenticationOAuthExchange(this.repository).execute(props);
  }

  async deleteAnonymousSubjects(props?: IDeleteAnonymousSubjectsExecuteProps) {
    return new DeleteAnonymousSubjects(this.repository).execute(props);
  }

  async deanonymize(props: IDeanonymizeExecuteProps) {
    return new Deanonymize(this.repository).execute(props);
  }

  async ecommerceOrderCheckout(props: IEcommerceOrderCheckoutExecuteProps) {
    return new EcommerceOrderCheckout(this.repository).execute(props);
  }

  async socialModuleChatSubjectsWithSocialModuleProfiles(
    props: IChatSubjectsWithSocialModuleProfilesProps,
  ) {
    return new ChatSubjectsWithSocialModuleProfiles(this.repository).execute(
      props,
    );
  }

  async billRoute(props: IBillRouteProps) {
    return this.billRouteService.execute(props);
  }

  async ecommerceOrderProceed(props: IEcommerceOrderProceedProps) {
    return this.ecommerceOrderProceedService.execute(props);
  }

  async telegramBootstrap(
    props: ITelegramBootstrapExecuteProps,
  ): Promise<ITelegramBootstrapResult> {
    return new TelegramBootstrap({
      findById: ({ id }) => this.findById({ id }),
      subjectsToIdentities: this.subjectsToIdentities,
      subjectsToSocialModuleProfiles: this.subjectsToSocialModuleProfiles,
    }).execute(props);
  }

  async telegramSyncMembership(
    props: ITelegramSyncMembershipExecuteProps,
  ): Promise<ITelegramSyncMembershipResult> {
    return new TelegramSyncMembership({
      subjectsToRoles: this.subjectsToRoles,
    }).execute(props);
  }

  async telegramCheckoutFreeSubscription(
    props: ITelegramCheckoutFreeSubscriptionExecuteProps,
  ) {
    return new TelegramCheckoutFreeSubscription({
      subjectsToEcommerceModuleOrders: this.subjectsToEcommerceModuleOrders,
    }).execute(props);
  }
}
