import { createModule } from "../module";
import { createModules } from "@sps/rbac/backend/app/api/src/lib/modules";
import { Service as OrderPaymentDispatch } from "../startup/ecommerce/order/payment-dispatch";
import { Service as OrderPaymentCheck } from "../startup/ecommerce/order/payment-check";
import { Service as StripeOrderPayment } from "../startup/ecommerce/order/stripe-payment";
import { Service as ProviderPeriod } from "../startup/ecommerce/order/provider-period";
import type { IProviderPeriodReceipt } from "@sps/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/settlement";
import { Service as OrderRenewal } from "../startup/ecommerce/order/renewal";
import type { IExecuteProps as IOrderRenewalProps } from "./ecommerce/order/renewal";
import type { Service as EcommerceCatalog } from "./ecommerce/catalog";
import type { Service as SecurityNotifications } from "./security-notifications";
import { Service as MutateCart } from "../startup/ecommerce/order/mutate-cart";
import { Service as CartSelection } from "../startup/ecommerce/order/selection";
import { Service as CartDetails } from "../startup/ecommerce/order/cart-details";
import type { IExecuteProps as ICartDetailsProps } from "./ecommerce/order/cart-details";
import type {
  IExecuteProps as ICartSelectionProps,
  IQuoteProps as ICartQuoteProps,
} from "./ecommerce/order/selection";
import type { IExecuteProps as IMutateCartProps } from "./ecommerce/order/mutate-cart";
import { Service as MergeGuestCart } from "../startup/ecommerce/order/merge-guest-cart";
import { Service as RepeatOrder } from "../startup/ecommerce/order/repeat";
import type { IExecuteProps as IRepeatOrderProps } from "./ecommerce/order/repeat";
import { Service as CreateCartOrder } from "../startup/ecommerce/order/create";
import type { IExecuteProps as ICreateCartOrderProps } from "./ecommerce/order/create";
import { Service as FindOpenCartOrderWithProduct } from "../startup/ecommerce/order/find-open-cart-order-with-product";
import type { IExecuteProps as IFindOpenCartOrderWithProductProps } from "./ecommerce/order/find-open-cart-order-with-product";
import { Service as SetOrderCurrency } from "../startup/ecommerce/order/set-currency";
import type { IExecuteProps as ISetOrderCurrencyProps } from "./ecommerce/order/set-currency";
import { Service as ResolveOrderCurrency } from "../startup/ecommerce/order/resolve-currency";
import type { IExecuteProps as IResolveOrderCurrencyProps } from "./ecommerce/order/resolve-currency";
import { Service as OrderPurchaseDetails } from "../startup/ecommerce/order/purchase-details";
import type { IExecuteProps as IOrderPurchaseDetailsProps } from "./ecommerce/order/purchase-details";
import { Service as RetryableOrderIds } from "../startup/ecommerce/order/retryable-ids";
import type { IExecuteProps as IRetryableOrderIdsProps } from "./ecommerce/order/retryable-ids";
import { Service as FreezeSubscriptionPeriod } from "../startup/ecommerce/order/freeze-subscription-period";
import type { IExecuteProps as IFreezeSubscriptionPeriodProps } from "./ecommerce/order/freeze-subscription-period";
import { Service as ChatParticipants } from "../startup/social-module/chat/participants";
import type { IExecuteProps as IChatParticipantsProps } from "./social-module/chat/participants";
import { Service as EcommerceOrderAccess } from "../startup/ecommerce/order/access";
import type { IExecuteProps as IEcommerceOrderAccessProps } from "./ecommerce/order/access";
import { Service as CrmFormRequestCreate } from "../startup/crm/form/request";
import type { IExecuteProps as ICrmFormRequestCreateProps } from "./crm/form/request";
import { Service as OrderWork } from "./ecommerce/order/work";
import { Service as CrmWorkspace } from "./crm/workspace";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Repository } from "../../repository";
import { verify } from "hono/jwt";
import { requestHostRevalidation } from "@sps/backend-utils";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import { Service as AiContextService } from "../startup/social-module/profile/ai/context";
import type {
  IAiContextServiceProps,
  IAiContextService,
} from "./social-module/profile/ai/context";
import { Service as ProfileOwnership } from "../startup/social-module/profile/ownership";
import { Service as AuthenticationMe } from "../startup/authentication/me";
import { Service as InitialGrantProducts } from "./billing/initial-grant-products";
import { Service as FreeSubscription } from "../startup/billing/free-subscription";
import type { IConstructorProps as IFreeSubscriptionDependencies } from "./billing/free-subscription";
import { Service as BlogArticleCreate } from "../startup/blog/article/create";
import { Service as RoleRevocation } from "../startup/ecommerce/order/role-revocation";
import type { IArticleCreateInput } from "@sps/rbac/models/subject/sdk/model/src/lib/blog-article-create";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service as Logout } from "../startup/logout";
import type { IExecuteProps as ILogoutExecuteProps } from "./logout";
import { Service as Me } from "../startup/me";
import type { IExecuteProps as IMeExecuteProps } from "./me";
import { Service as Refresh } from "../startup/refresh";
import type { IExecuteProps as IRefreshExecuteProps } from "./refresh";
import { Service as Init } from "../startup/init";
import type { IExecuteProps as IInitExecuteProps } from "./init";
import { Service as RecordActivity } from "../startup/record-activity";
import type { IExecuteProps as IRecordActivityExecuteProps } from "./record-activity";
import { Service as AuthenticationEmailAndPassword } from "../startup/authentication/email-and-password";
import type { IExecuteProps as IAuthenticationEmailAndPasswordExecuteProps } from "./authentication/email-and-password";
import type {
  Service as IsAuthorized,
  IExecuteProps as IIsAuthorizedExecuteProps,
} from "./is-authorized";
import { Service as AuthenticationEthereumVirtualMachine } from "../startup/authentication/ethereum-virtual-machine";
import type { IExecuteProps as IAuthenticationEthereumVirtualMachineExecuteProps } from "./authentication/ethereum-virtual-machine";
import { Service as AuthenticationOAuthStart } from "../startup/authentication/oauth/start";
import type { IExecuteProps as IAuthenticationOAuthStartExecuteProps } from "./authentication/oauth/start";
import { Service as AuthenticationOAuthCallback } from "../startup/authentication/oauth/callback";
import type { IExecuteProps as IAuthenticationOAuthCallbackExecuteProps } from "./authentication/oauth/callback";
import { Service as AuthenticationOAuthExchange } from "../startup/authentication/oauth/exchange";
import type { IExecuteProps as IAuthenticationOAuthExchangeExecuteProps } from "./authentication/oauth/exchange";
import { Service as DeleteAnonymousSubjects } from "../startup/delete-anonymous-subjects";
import type {
  IExecuteProps as IDeleteAnonymousSubjectsExecuteProps,
  IRetentionBlocker as IAnonymousSubjectRetentionBlocker,
} from "./delete-anonymous-subjects";
import { Service as Deanonymize } from "../startup/deanonymize";
import type { IExecuteProps as IDeanonymizeExecuteProps } from "./deanonymize";
import { Service as EcommerceOrderCheckout } from "../startup/ecommerce/order/checkout";
import type { IExecuteProps as IEcommerceOrderCheckoutExecuteProps } from "./ecommerce/order/checkout";
import { Service as EcommerceProductCheckout } from "../startup/ecommerce/product/checkout";
import type { IExecuteProps as IEcommerceProductCheckoutProps } from "./ecommerce/product/checkout";
import { Service as EcommerceOrdersToProductsList } from "../startup/ecommerce/orders-to-products/list";
import type { IExecuteProps as IEcommerceOrdersToProductsListExecuteProps } from "./ecommerce/orders-to-products/list";
import { Service as ChatSubjectsWithSocialModuleProfiles } from "../startup/social-module/chat/subjects-with-profiles";
import type { IExecuteProps as IChatSubjectsWithSocialModuleProfilesProps } from "./social-module/chat/subjects-with-profiles";
import type {
  Service as EcommerceOrderProceed,
  IExecuteProps as IEcommerceOrderProceedProps,
} from "./ecommerce/order/proceed";
import { SubjectDI } from "../../di";
import { Service as TelegramBootstrap } from "../startup/telegram/bootstrap";
import type {
  IExecuteProps as ITelegramBootstrapExecuteProps,
  IResult as ITelegramBootstrapResult,
} from "./telegram/bootstrap";
import { Service as TelegramPersonalAiAgent } from "../startup/telegram/personal-ai-agent";
import type {
  IExecuteProps as ITelegramPersonalAiAgentExecuteProps,
  IResult as ITelegramPersonalAiAgentResult,
} from "./telegram/personal-ai-agent";
import { Service as TelegramSyncMembership } from "../startup/telegram/sync-membership";
import type {
  IExecuteProps as ITelegramSyncMembershipExecuteProps,
  IResult as ITelegramSyncMembershipResult,
} from "./telegram/sync-membership";
import { Service as TelegramCheckoutFreeSubscription } from "../startup/telegram/checkout-free-subscription";
import type { IExecuteProps as ITelegramCheckoutFreeSubscriptionExecuteProps } from "./telegram/checkout-free-subscription";
import { Service as ChatLifecycleService } from "../startup/social-module/chat/lifecycle";
import { Service as ProfileMcpCatalogService } from "../startup/social-module/profile/mcp/catalog";
import type {
  IProfileMcpCatalogOpenProps,
  IProfileMcpCatalogSession,
} from "./social-module/profile/mcp/catalog";
import { Service as AiExecutionActionReporter } from "../startup/social-module/profile/ai/execution-action";
import type {
  IAiExecutionActionReporter,
  IAiExecutionActionReporterProps,
} from "./social-module/profile/ai/execution-action";
import { Service as SocialProfileAiToolLoop } from "../startup/social-module/profile/ai/tool-loop";
import type {
  ISocialProfileAiToolLoopProps,
  ISocialProfileAiToolLoopResult,
} from "./social-module/profile/ai/tool-loop";

import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { setRbacAiThreadModelPreference } from "@sps/rbac/models/subject/sdk/model";
import { Service as SocialProfileKnowledgeAccessService } from "../startup/social-module/profile/knowledge/access";
import type { IEnsureSocialProfileKnowledgeAccessProps } from "./social-module/profile/knowledge/access";
import { Service as SocialModuleProfileAvatarUpdate } from "../startup/social-module/profile/avatar";
import type { IExecuteProps as ISocialModuleProfileAvatarUpdateProps } from "./social-module/profile/avatar";

import { ProviderConnections } from "./provider-connections";
import { Service as CustomerWork } from "./ecommerce/customer-work";
import { WorkLedger } from "./billing/work-ledger";
import { Service as PermissionDefaults } from "../startup/permission-defaults";

export type SubjectServiceDependencies<Keys extends keyof Service = never> =
  Pick<Service, "module" | "modules" | Keys>;

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get orderWork() {
    return new OrderWork(this);
  }

  get crmWorkspace() {
    return new CrmWorkspace(this);
  }

  get providerConnections() {
    return new ProviderConnections(this);
  }

  get customerWork() {
    return new CustomerWork(this);
  }

  get workLedger() {
    return new WorkLedger(this);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  declare repository: Repository;
  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(SubjectDI.ISecurityNotificationsService)
    private readonly securityNotifications: SecurityNotifications,
    @inject(SubjectDI.IIsAuthorizedService)
    readonly isAuthorizedService: IsAuthorized,
    @inject(SubjectDI.IEcommerceOrderProceedService)
    private readonly ecommerceOrderProceedService: EcommerceOrderProceed,
    @inject(SubjectDI.IEcommerceCatalogService)
    readonly ecommerceCatalog: EcommerceCatalog,
  ) {
    super(repository);
  }

  async sendSecurityNotifications() {
    await this.securityNotifications.execute();
  }

  configureRoleRevocation() {
    const { module, modules } = this;
    const revocation = new RoleRevocation({
      get subjectsToEcommerceModuleOrders() {
        return module.subjectsToEcommerceModuleOrders;
      },
      get rolesToEcommerceModuleProducts() {
        return module.role.module.rolesToEcommerceModuleProducts;
      },
      get order() {
        return modules.ecommerce.order;
      },
    });
    module.subjectsToRoles.configureRevocation(revocation);
    return revocation;
  }

  async ecommerceModuleOrderMutateCart(props: IMutateCartProps) {
    return new MutateCart({
      repository: this.repository,
      service: this,
      closeRemovedWork: (input) => this.customerWork.closeRemovedOrder(input),
    }).execute(props);
  }

  async ecommerceModuleOrderSelection(props: ICartSelectionProps) {
    return new CartSelection({
      repository: this.repository,
      service: this,
    }).execute(props);
  }

  async ecommerceModuleCartQuote(props: ICartQuoteProps) {
    return new CartSelection({
      repository: this.repository,
      service: this,
    }).quote(props);
  }

  async ecommerceModuleOrderCartDetails(props: ICartDetailsProps) {
    return new CartDetails({ service: this }).execute(props);
  }

  async ecommerceModuleOrderRepeat(props: IRepeatOrderProps) {
    return new RepeatOrder({
      repository: this.repository,
      service: this,
    }).execute(props);
  }

  async ecommerceModuleOrderCreate(props: ICreateCartOrderProps) {
    return new CreateCartOrder({
      repository: this.repository,
      service: this,
    }).execute(props);
  }

  async ecommerceModuleFindOpenCartOrderWithProduct(
    props: IFindOpenCartOrderWithProductProps,
  ): Promise<string | null> {
    return new FindOpenCartOrderWithProduct({
      order: this.modules.ecommerce.order,
      ordersToProducts: this.modules.ecommerce.ordersToProducts,
      subjectsToEcommerceModuleOrders:
        this.module.subjectsToEcommerceModuleOrders,
    }).execute(props);
  }

  async ecommerceModuleResolveOrderCurrency(props: IResolveOrderCurrencyProps) {
    return new ResolveOrderCurrency({
      storesToProducts: this.modules.ecommerce.storesToProducts,
      attributeKey: this.modules.ecommerce.attributeKey,
      attributeKeysToAttributes:
        this.modules.ecommerce.attributeKeysToAttributes,
      productsToAttributes: this.modules.ecommerce.productsToAttributes,
      attributesToBillingModuleCurrencies:
        this.modules.ecommerce.attributesToBillingModuleCurrencies,
      currency: this.modules.billing.currency,
    }).execute(props);
  }

  async ecommerceModuleOrderRetryableIds(props: IRetryableOrderIdsProps) {
    return new RetryableOrderIds(this).execute(props);
  }

  async ecommerceModuleOrderPurchaseDetails(props: IOrderPurchaseDetailsProps) {
    return new OrderPurchaseDetails({ service: this }).execute(props);
  }

  async ecommerceModuleOrderPurchasePayments(
    props: IRetryableOrderIdsProps & { subjectId: string },
  ) {
    return new RetryableOrderIds(this).purchasePayments(props);
  }

  async ecommerceModuleOrderSettledIds(props: { orderIds: string[] }) {
    return new RetryableOrderIds(this).settledIds(props);
  }

  async ecommerceModuleOrderSetCurrency(props: ISetOrderCurrencyProps) {
    return new SetOrderCurrency({ service: this }).execute(props);
  }

  async ecommerceModuleOrderAssertAccess(props: IEcommerceOrderAccessProps) {
    return new EcommerceOrderAccess({
      subjectsToOrders: this.module.subjectsToEcommerceModuleOrders,
      ordersToProducts: this.modules.ecommerce.ordersToProducts,
    }).execute(props);
  }

  async ecommerceModuleOrderFreezeSubscriptionPeriod(
    props: IFreezeSubscriptionPeriodProps,
  ) {
    return new FreezeSubscriptionPeriod({ service: this }).execute(props);
  }

  async isAuthorized(props: IIsAuthorizedExecuteProps): Promise<any> {
    return this.isAuthorizedService.execute(props);
  }

  async socialModuleProfileAvatarUpdate(
    props: ISocialModuleProfileAvatarUpdateProps,
  ) {
    return new SocialModuleProfileAvatarUpdate({
      file: this.modules.fileStorage.file,
    }).execute(props);
  }

  async socialModuleProfileMcpCatalogOpen(
    props: IProfileMcpCatalogOpenProps,
  ): Promise<IProfileMcpCatalogSession> {
    return this.getSocialModuleProfileMcpCatalogService().open(props);
  }

  async socialModuleProfileAvatarFind(props: {
    socialModuleProfileId: string | undefined;
  }) {
    return new SocialModuleProfileAvatarUpdate({
      file: this.modules.fileStorage.file,
    }).find(props.socialModuleProfileId);
  }

  async socialModuleProfileAiToolLoopRun(
    props: ISocialProfileAiToolLoopProps,
  ): Promise<ISocialProfileAiToolLoopResult> {
    return this.getSocialModuleProfileAiToolLoopService().run(props);
  }

  socialModuleProfileAiContextCreate(
    props: Omit<IAiContextServiceProps, "modules">,
  ): IAiContextService {
    return this.createSocialModuleProfileAiContextService({
      ...props,
      modules: this.modules,
    });
  }

  socialModuleProfileAiExecutionActionReporterCreate(
    props: IAiExecutionActionReporterProps,
  ): IAiExecutionActionReporter {
    return this.createSocialModuleProfileAiExecutionActionReporter(props);
  }

  async socialModuleChatThreadOpenRouterModelUpdate(props: {
    subjectId: string;
    socialModuleChatId: string;
    socialModuleThreadId: string;
    modelId: string;
  }): Promise<ISocialModuleThread> {
    await this.socialModuleChatLifecycleAssertSubjectOwnsChat({
      subjectId: props.subjectId,
      socialModuleChatId: props.socialModuleChatId,
    });
    await this.socialModuleChatLifecycleAssertThreadBelongsToChat({
      socialModuleChatId: props.socialModuleChatId,
      socialModuleThreadId: props.socialModuleThreadId,
    });

    const thread = await this.modules.social.thread.findById({
      id: props.socialModuleThreadId,
    });

    if (!thread) {
      throw new Error("Not found error. Social module thread not found");
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      let current;
      if (attempt) {
        current = await this.modules.social.thread.findById({ id: thread.id });
      } else {
        current = thread;
      }
      const metadata = setRbacAiThreadModelPreference({
        metadata: current.metadata,
        modelId: props.modelId,
      });
      const updated = await this.modules.social.thread.update({
        id: current.id,
        data: {
          metadataNamespaceUpdate: {
            namespace: "rbacAiThreadPreferences",
            expectedValue: current.metadata.rbacAiThreadPreferences ?? null,
            value: metadata.rbacAiThreadPreferences,
          },
        },
      });
      if (updated) return updated;
    }
    throw new Error(
      "Conflict error. Thread preferences changed concurrently. Retry with the current thread.",
    );
  }

  async logout(props: ILogoutExecuteProps) {
    const logout = new Logout({
      me: (meProps) => this.me(meProps),
      update: ({ id, data }) => this.update({ id, data }),
      invalidateSubjectRevocationCache: (subjectId) =>
        this.isAuthorizedService.invalidateSubjectRevocationCache(subjectId),
    });
    const result = await logout.execute(props);

    return result;
  }

  async me(props: IMeExecuteProps) {
    return new Me({
      findById: ({ id }) => this.findById({ id }),
    }).execute(props);
  }

  async recordActivity(props: IRecordActivityExecuteProps) {
    return new RecordActivity({
      update: ({ id, data }) => this.update({ id, data }),
    }).execute(props);
  }

  async init(props: IInitExecuteProps) {
    return new Init({
      me: (meProps) => this.me(meProps),
      recordActivity: (recordActivityProps) =>
        this.recordActivity(recordActivityProps),
    }).execute(props);
  }

  async refresh(props: IRefreshExecuteProps) {
    return new Refresh({
      repository: this.repository,
      recordActivity: (recordActivityProps) =>
        this.recordActivity(recordActivityProps),
    }).execute(props);
  }

  async authenticationLoginAndPassowrd({
    guestToken,
    ...props
  }: IAuthenticationEmailAndPasswordExecuteProps & { guestToken?: string }) {
    const authentication = await new AuthenticationEmailAndPassword(
      this.repository,
    ).execute(props);

    const result = await this.completeUserAuthentication(
      authentication,
      guestToken,
    );

    return result;
  }

  async authenticationEthereumVirtualMachine({
    guestToken,
    ...props
  }: IAuthenticationEthereumVirtualMachineExecuteProps & {
    guestToken?: string;
  }) {
    const authentication = await new AuthenticationEthereumVirtualMachine(
      this.repository,
    ).execute(props);

    const result = await this.completeUserAuthentication(
      authentication,
      guestToken,
    );

    return result;
  }

  async authenticationOAuthStart(props: IAuthenticationOAuthStartExecuteProps) {
    return new AuthenticationOAuthStart(this.repository).execute(props);
  }

  async authenticationOAuthCallback(
    props: IAuthenticationOAuthCallbackExecuteProps,
  ) {
    return new AuthenticationOAuthCallback(this.repository).execute(props);
  }

  async authenticationOAuthExchange({
    guestToken,
    ...props
  }: IAuthenticationOAuthExchangeExecuteProps & { guestToken?: string }) {
    const authentication = await new AuthenticationOAuthExchange(
      this.repository,
    ).execute(props);

    const result = await this.completeUserAuthentication(
      authentication,
      guestToken,
    );

    return result;
  }

  async socialModuleProfileOwnershipEnsure(props: { subjectId: string }) {
    return new ProfileOwnership(this).ensure(props);
  }

  async blogModuleArticleCreate(props: {
    subjectId: string;
    data: IArticleCreateInput;
  }) {
    return new BlogArticleCreate(this).execute(props);
  }

  async revalidateHostCache() {
    await requestHostRevalidation({ path: "/", type: "layout" });
  }

  permissionDefaults() {
    return new PermissionDefaults(
      this.module.role.module.permission,
      this.module.role.module.rolesToPermissions,
    ).execute();
  }

  async isAdmin(subjectId: string) {
    const [adminRole] =
      (await this.module.role.find({
        params: {
          filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
          limit: 1,
        },
      })) ?? [];
    if (!adminRole) return false;

    const links = await this.module.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            { column: "subjectId", method: "eq", value: subjectId },
            { column: "roleId", method: "eq", value: adminRole.id },
          ],
        },
        limit: 1,
      },
    });
    return Boolean(links?.length);
  }

  async authenticationMe(props: { subjectId: string }) {
    return new AuthenticationMe(this).execute(props);
  }

  protected async completeUserAuthentication<T extends { jwt: string }>(
    result: T,
    guestToken?: string,
  ): Promise<T> {
    if (!RBAC_JWT_SECRET)
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    const decoded = await verify(result.jwt, RBAC_JWT_SECRET, "HS256");
    const subjectId = decoded.subject?.["id"];
    if (typeof subjectId !== "string")
      throw new Error(
        "Authentication error. No Subject in authenticated session",
      );
    await this.socialModuleProfileOwnershipEnsure({ subjectId });
    await this.freeSubscriptionEnsure({ subjectId });
    if (guestToken) {
      await new MergeGuestCart(this, this.customerWork).execute({
        subjectId,
        guestToken,
      });
    }
    return result;
  }

  async ecommerceModuleProductInitialGrantIncludes(props: {
    productId: string;
  }) {
    return new InitialGrantProducts(
      this.modules.ecommerce.storesToProducts,
    ).includes(props.productId);
  }

  async freeSubscriptionEnsure(props: { subjectId: string }) {
    await new FreeSubscription(this.getFreeSubscriptionDependencies()).execute({
      id: props.subjectId,
    });
  }

  protected getFreeSubscriptionDependencies(): IFreeSubscriptionDependencies {
    return {
      repository: this.repository,
      module: this.module,
      modules: this.modules,
      fulfillPaidOrderInTransaction: (scope) =>
        this.ecommerceOrderProceedService.fulfillPaidOrderInTransaction(scope),
      dispatchPaidEffects: (effect) =>
        this.ecommerceOrderProceedService.dispatchPaidEffects(effect),
    };
  }

  async deleteAnonymousSubjects(props?: IDeleteAnonymousSubjectsExecuteProps) {
    return new DeleteAnonymousSubjects({
      find: (findProps) => this.find(findProps),
      delete: ({ id }) => this.delete({ id }),
      blockers: this.anonymousSubjectRetentionBlockers(),
    }).execute(props);
  }

  /**
   * Relations that keep an inactive anonymous subject. A project extends the
   * list from its `startup` service subclass when it owns other subject
   * relations.
   */
  anonymousSubjectRetentionBlockers(): IAnonymousSubjectRetentionBlocker[] {
    return [
      {
        reason: "identity",
        find: (findProps) => this.module.subjectsToIdentities.find(findProps),
      },
      {
        reason: "ecommerce-module-order",
        find: (findProps) =>
          this.module.subjectsToEcommerceModuleOrders.find(findProps),
      },
      {
        reason: "social-module-profile",
        find: (findProps) =>
          this.module.subjectsToSocialModuleProfiles.find(findProps),
      },
      {
        reason: "role",
        find: (findProps) => this.module.subjectsToRoles.find(findProps),
      },
      {
        reason: "billing-module-currency",
        find: (findProps) =>
          this.module.subjectsToBillingModuleCurrencies.find(findProps),
      },
    ];
  }

  async deanonymize(props: IDeanonymizeExecuteProps) {
    return new Deanonymize({
      findById: ({ id }) => this.findById({ id }),
      identity: this.module.identity,
      subjectsToIdentities: this.module.subjectsToIdentities,
    }).execute(props);
  }

  get ecommerceModuleOrderPaymentDispatch() {
    return new OrderPaymentDispatch(this.modules.ecommerce.order.paymentIntent);
  }

  get ecommerceModuleOrderPaymentCheck() {
    return new OrderPaymentCheck(
      this.modules.ecommerce.order.paymentIntent,
      this.ecommerceModuleOrderStripePayment,
    );
  }

  get ecommerceModuleOrderStripePayment() {
    return new StripeOrderPayment(this);
  }

  async ecommerceModuleOrderResolveProviderPeriod(
    props: IProviderPeriodReceipt,
  ) {
    return new ProviderPeriod({
      repository: this.repository,
      service: this,
    }).execute(props);
  }

  async ecommerceModuleOrderRenewal(
    props: IOrderRenewalProps,
    internal?: { skipProviderReconciliation?: boolean },
  ) {
    return new OrderRenewal({
      repository: this.repository,
      service: this,
    }).execute(props, internal);
  }

  async ecommerceOrderCheckout(
    props: IEcommerceOrderCheckoutExecuteProps,
    internal?: {
      deferProviderCheckout?: boolean;
      manualSubscriptionPeriod?: boolean;
      providerContractPaymentIntentId?: string;
    },
  ) {
    return new EcommerceOrderCheckout({
      repository: this.repository,
      settledOrderIds: (input) => this.ecommerceModuleOrderSettledIds(input),
      findById: ({ id }) => this.findById({ id }),
      module: this.module,
      modules: this.modules,
    }).execute(props, internal);
  }

  async crmModuleFormRequestCreate(props: ICrmFormRequestCreateProps) {
    return this.getCrmFormRequestCreateService().execute(props);
  }

  async ecommerceProductCheckout(props: IEcommerceProductCheckoutProps) {
    return this.getEcommerceProductCheckoutService().execute(props);
  }

  async socialModuleChatLifecycleIsSubjectAdmin(props: { subjectId: string }) {
    return this.getChatLifecycleService().isSubjectAdmin(props.subjectId);
  }

  async socialModuleChatParticipants(props: IChatParticipantsProps) {
    return new ChatParticipants(this).execute(props);
  }

  async ecommerceOrdersToProductsList(
    props: IEcommerceOrdersToProductsListExecuteProps,
  ) {
    return new EcommerceOrdersToProductsList({
      ordersToProducts: this.modules.ecommerce.ordersToProducts,
      subjectsToEcommerceModuleOrders:
        this.module.subjectsToEcommerceModuleOrders,
    }).execute(props);
  }

  async socialModuleChatSubjectsWithSocialModuleProfiles(
    props: IChatSubjectsWithSocialModuleProfilesProps,
  ) {
    return new ChatSubjectsWithSocialModuleProfiles(this.repository).execute(
      props,
    );
  }

  async socialModuleChatLifecycleCreateChatWithDefaultThread(props: {
    subjectId: string;
    data: Partial<ISocialModuleChat>;
    requestedSocialModuleProfileId?: string;
    autoBootstrapProfile: boolean;
  }) {
    return this.getChatLifecycleService().createChatWithDefaultThread(props);
  }

  async socialModuleChatLifecycleAssertSubjectOwnsChat(props: {
    subjectId: string;
    socialModuleChatId: string;
  }) {
    return this.getChatLifecycleService().assertSubjectOwnsChat(props);
  }

  async socialModuleChatLifecycleResolveSubjectProfileIdInChat(props: {
    subjectId: string;
    socialModuleChatId: string;
  }) {
    return this.getChatLifecycleService().resolveSubjectProfileIdInChat(props);
  }

  async socialModuleChatLifecycleAssertThreadBelongsToChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }) {
    return this.getChatLifecycleService().assertThreadBelongsToChat(props);
  }

  async socialModuleChatLifecycleEnsureDefaultThreadForChat(props: {
    socialModuleChatId: string;
  }): Promise<ISocialModuleThread> {
    return this.getChatLifecycleService().ensureDefaultThreadForChat(props);
  }

  async ecommerceOrderProceed(props: IEcommerceOrderProceedProps) {
    return this.ecommerceOrderProceedService.execute(props);
  }

  async telegramBootstrap(
    props: ITelegramBootstrapExecuteProps,
  ): Promise<ITelegramBootstrapResult> {
    const result = await new TelegramBootstrap({
      findById: ({ id }) => this.findById({ id }),
      identity: this.module.identity,
      social: this.modules.social,
      subjectsToIdentities: this.module.subjectsToIdentities,
      subjectsToSocialModuleProfiles:
        this.module.subjectsToSocialModuleProfiles,
      resolvePersonalAiAgent: (personalAiAgentProps) =>
        this.telegramPersonalAiAgentEnsure(personalAiAgentProps),
      ensureProfileManagementAccess: (accessProps) =>
        this.socialModuleProfileKnowledgeAccessEnsure(accessProps),
    }).execute(props);
    await this.socialModuleProfileOwnershipEnsure({
      subjectId: result.rbacModuleSubject.id,
    });
    return result;
  }

  async telegramPersonalAiAgentEnsure(
    props: ITelegramPersonalAiAgentExecuteProps,
  ): Promise<ITelegramPersonalAiAgentResult> {
    return new TelegramPersonalAiAgent({
      findSubjects: (findProps) => this.find(findProps),
      social: this.modules.social,
      subjectsToSocialModuleProfiles:
        this.module.subjectsToSocialModuleProfiles,
      ensureKnowledgeAccess: (accessProps) =>
        this.socialModuleProfileKnowledgeAccessEnsure(accessProps),
    }).execute(props);
  }

  async socialModuleProfileKnowledgeAccessEnsure(
    props: IEnsureSocialProfileKnowledgeAccessProps,
  ) {
    const result = await new SocialProfileKnowledgeAccessService({
      permission: this.module.role.module.permission,
      role: this.module.role,
      rolesToPermissions: this.module.role.module.rolesToPermissions,
      subjectsToRoles: this.module.subjectsToRoles,
    }).ensure(props);

    this.isAuthorizedService.invalidateSubjectRoleCache(
      props.ownerRbacSubjectId,
    );

    return result;
  }

  async telegramSyncMembership(
    props: ITelegramSyncMembershipExecuteProps,
  ): Promise<ITelegramSyncMembershipResult> {
    return new TelegramSyncMembership({
      role: this.module.role,
      subjectsToRoles: this.module.subjectsToRoles,
      rolesToEcommerceModuleProducts:
        this.module.role.module.rolesToEcommerceModuleProducts,
    }).execute(props);
  }

  async telegramCheckoutFreeSubscription(
    props: ITelegramCheckoutFreeSubscriptionExecuteProps,
  ) {
    return new TelegramCheckoutFreeSubscription(
      this.getFreeSubscriptionDependencies(),
    ).execute(props);
  }

  protected getChatLifecycleService() {
    return new ChatLifecycleService(this);
  }

  protected getCrmFormRequestCreateService() {
    return new CrmFormRequestCreate(this);
  }

  protected getEcommerceProductCheckoutService() {
    return new EcommerceProductCheckout(this);
  }

  protected getSocialModuleProfileMcpCatalogService() {
    return new ProfileMcpCatalogService();
  }

  protected getSocialModuleProfileAiToolLoopService() {
    return new SocialProfileAiToolLoop();
  }

  protected createSocialModuleProfileAiContextService(
    props: IAiContextServiceProps,
  ): IAiContextService {
    return new AiContextService(props);
  }

  protected createSocialModuleProfileAiExecutionActionReporter(
    props: IAiExecutionActionReporterProps,
  ) {
    return new AiExecutionActionReporter(props);
  }
}

export type {
  ICrmModuleFormRequestCreateProps,
  IEcommerceProductCheckoutProps,
  IAiContextService,
  IAiContextServiceProps,
  IAiContextPrepareProps,
  IAiContextPreparation,
  IAiContextHistoryMessage,
  IAiExecutionActionReporter,
  IAiExecutionActionReporterProps,
  IOpenRouterBillingLedgerEntry,
  IProfileMcpCatalogSession,
  ISocialProfileAiTool,
  ISocialProfileAiToolLoopProps,
  ISocialProfileAiToolLoopResult,
  TOpenRouterBillingPurpose,
} from "./public-contract";
