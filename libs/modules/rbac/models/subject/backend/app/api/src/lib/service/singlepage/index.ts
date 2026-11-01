import {
  Service as FreezeSubscriptionPeriod,
  type IExecuteProps as IFreezeSubscriptionPeriodProps,
} from "./ecommerce/order/freeze-subscription-period";
import {
  Service as ChatParticipants,
  type IExecuteProps as IChatParticipantsProps,
} from "./social-module/chat/participants";
import {
  Service as EcommerceOrderAccess,
  type IExecuteProps as IEcommerceOrderAccessProps,
} from "./ecommerce/order/access";
import {
  Service as CrmFormRequestCreate,
  type IExecuteProps as ICrmFormRequestCreateProps,
} from "./crm/form/request";
import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Repository } from "../../repository";
import { verify } from "hono/jwt";
import { RBAC_JWT_SECRET } from "@sps/shared-utils";
import {
  Service as AiContextService,
  type IAiContextServiceProps,
  type IAiContextService,
} from "./social-module/profile/ai/context";
import { Service as ProfileOwnership } from "./social-module/profile/ownership";
import {
  Service as ProfileSkills,
  type IForDocumentProps as IProfileDocumentSkillProps,
} from "./social-module/profile/skills";
import { Service as AuthenticationMe } from "./authentication/me";
import {
  Service as FreeSubscription,
  type IConstructorProps as IFreeSubscriptionDependencies,
} from "./billing/free-subscription";
import { Service as BlogArticleCreate } from "./blog/article/create";
import { Service as RoleRevocation } from "./ecommerce/order/role-revocation";
import type { IArticleCreateInput } from "@sps/rbac/models/subject/sdk/model/src/lib/blog-article-create";
import type { Service as SubjectsToBlogModuleArticlesService } from "@sps/rbac/relations/subjects-to-blog-module-articles/backend/app/api/src/lib/service";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service as Logout } from "./logout";
import {
  Service as Refresh,
  IExecuteProps as IRefreshExecuteProps,
} from "./refresh";
import { Service as Init, IExecuteProps as IInitExecuteProps } from "./init";
import {
  Service as RecordActivity,
  IExecuteProps as IRecordActivityExecuteProps,
} from "./record-activity";
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
  IRetentionBlocker as IAnonymousSubjectRetentionBlocker,
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
  Service as EcommerceProductCheckout,
  type IExecuteProps as IEcommerceProductCheckoutProps,
} from "./ecommerce/product/checkout";
import {
  Service as ChatSubjectsWithSocialModuleProfiles,
  IExecuteProps as IChatSubjectsWithSocialModuleProfilesProps,
} from "./social-module/chat/subjects-with-profiles";
import {
  Service as BillRoute,
  IExecuteProps as IBillRouteProps,
  ISettleProps as IBillRouteSettleProps,
} from "./billing/route";
import {
  Service as EcommerceOrderProceed,
  IExecuteProps as IEcommerceOrderProceedProps,
} from "./ecommerce/order/proceed";
import {
  SubjectDI,
  type IBlogModule,
  type IBillingModule,
  type IBroadcastModule,
  type ICrmModule,
  type IEcommerceModule,
  type IFileStorageModule,
  type INotificationModule,
  type ISocialModule,
} from "../../di";
import { Service as IdentityService } from "@sps/rbac/models/identity/backend/app/api/src/lib/service";
import { Service as RoleService } from "@sps/rbac/models/role/backend/app/api/src/lib/service";
import { Service as PermissionService } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import { Service as RolesToPermissionsService } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { Service as SubjectsToRolesService } from "@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/service";
import { Service as SubjectsToEcommerceModuleOrdersService } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/app/api/src/lib/service";
import { Service as SubjectsToBillingModuleCurrenciesService } from "@sps/rbac/relations/subjects-to-billing-module-currencies/backend/app/api/src/lib/service";
import { Service as RolesToEcommerceModuleProductsService } from "@sps/rbac/relations/roles-to-ecommerce-module-products/backend/app/api/src/lib/service";
import {
  Service as TelegramBootstrap,
  IExecuteProps as ITelegramBootstrapExecuteProps,
  IResult as ITelegramBootstrapResult,
} from "./telegram/bootstrap";
import {
  Service as TelegramPersonalAiAgent,
  IExecuteProps as ITelegramPersonalAiAgentExecuteProps,
  IResult as ITelegramPersonalAiAgentResult,
} from "./telegram/personal-ai-agent";
import {
  Service as TelegramSyncMembership,
  IExecuteProps as ITelegramSyncMembershipExecuteProps,
  IResult as ITelegramSyncMembershipResult,
} from "./telegram/sync-membership";
import {
  Service as TelegramCheckoutFreeSubscription,
  IExecuteProps as ITelegramCheckoutFreeSubscriptionExecuteProps,
} from "./telegram/checkout-free-subscription";
import { ChatLifecycleService } from "./social-module/chat/lifecycle";
import {
  ProfileMcpCatalogService,
  type IProfileMcpCatalogOpenProps,
  type IProfileMcpCatalogSession,
} from "./social-module/profile/mcp/catalog";
import {
  AiExecutionActionReporter,
  type IAiExecutionActionReporter,
  type IAiExecutionActionReporterProps,
} from "./social-module/profile/ai/execution-action";
import {
  SocialProfileAiToolLoop,
  type ISocialProfileAiToolLoopProps,
  type ISocialProfileAiToolLoopResult,
} from "./social-module/profile/ai/tool-loop";
import {
  summarizeOpenRouterBilling,
  type IOpenRouterBillingSummary,
  type IOpenRouterBillingSummaryProps,
} from "./billing/open-router";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { setRbacAiThreadModelPreference } from "@sps/rbac/models/subject/sdk/model";
import {
  SocialProfileKnowledgeAccessService,
  type IEnsureSocialProfileKnowledgeAccessProps,
} from "./social-module/profile/knowledge/access";
import {
  Service as SocialModuleProfileAvatarUpdate,
  type IExecuteProps as ISocialModuleProfileAvatarUpdateProps,
} from "./social-module/profile/avatar";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  declare repository: Repository;
  blogModule: IBlogModule;
  subjectsToBlogModuleArticles: SubjectsToBlogModuleArticlesService;
  socialModule: ISocialModule;
  ecommerceModule: IEcommerceModule;
  billingModule: IBillingModule;
  notificationModule: INotificationModule;
  fileStorageModule: IFileStorageModule;
  crmModule: ICrmModule;
  broadcastModule: IBroadcastModule;
  isAuthorizedService: IsAuthorized;
  billRouteService: BillRoute;
  ecommerceOrderProceedService: EcommerceOrderProceed;
  identity: IdentityService;
  role: RoleService;
  permission: PermissionService;
  rolesToPermissions: RolesToPermissionsService;
  rolesToEcommerceModuleProducts: RolesToEcommerceModuleProductsService;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  subjectsToRoles: SubjectsToRolesService;
  subjectsToEcommerceModuleOrders: SubjectsToEcommerceModuleOrdersService;
  subjectsToBillingModuleCurrencies: SubjectsToBillingModuleCurrenciesService;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(SubjectDI.ISocialModule) socialModule: ISocialModule,
    @inject(SubjectDI.IEcommerceModule) ecommerceModule: IEcommerceModule,
    @inject(SubjectDI.IBillingModule) billingModule: IBillingModule,
    @inject(SubjectDI.INotificationModule)
    notificationModule: INotificationModule,
    @inject(SubjectDI.IFileStorageModule) fileStorageModule: IFileStorageModule,
    @inject(SubjectDI.ICrmModule) crmModule: ICrmModule,
    @inject(SubjectDI.IBroadcastModule) broadcastModule: IBroadcastModule,
    @inject(SubjectDI.IIdentityService) identity: IdentityService,
    @inject(SubjectDI.IRoleService) role: RoleService,
    @inject(SubjectDI.IPermissionService) permission: PermissionService,
    @inject(SubjectDI.IRolesToPermissionsService)
    rolesToPermissions: RolesToPermissionsService,
    @inject(SubjectDI.IRolesToEcommerceModuleProductsService)
    rolesToEcommerceModuleProducts: RolesToEcommerceModuleProductsService,
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
    @inject(SubjectDI.ISubjectsToBillingModuleCurrenciesService)
    subjectsToBillingModuleCurrencies: SubjectsToBillingModuleCurrenciesService,
    @inject(SubjectDI.IBlogModule) blogModule: IBlogModule,
    @inject(SubjectDI.ISubjectsToBlogModuleArticlesService)
    subjectsToBlogModuleArticles: SubjectsToBlogModuleArticlesService,
  ) {
    super(repository);
    this.socialModule = socialModule;
    this.ecommerceModule = ecommerceModule;
    this.billingModule = billingModule;
    this.notificationModule = notificationModule;
    this.fileStorageModule = fileStorageModule;
    this.crmModule = crmModule;
    this.broadcastModule = broadcastModule;
    this.identity = identity;
    this.role = role;
    this.permission = permission;
    this.rolesToPermissions = rolesToPermissions;
    this.rolesToEcommerceModuleProducts = rolesToEcommerceModuleProducts;
    this.isAuthorizedService = isAuthorizedService;
    this.billRouteService = billRouteService;
    this.ecommerceOrderProceedService = ecommerceOrderProceedService;
    this.subjectsToIdentities = subjectsToIdentities;
    this.subjectsToSocialModuleProfiles = subjectsToSocialModuleProfiles;
    this.subjectsToRoles = subjectsToRoles;
    this.subjectsToEcommerceModuleOrders = subjectsToEcommerceModuleOrders;
    this.subjectsToBillingModuleCurrencies = subjectsToBillingModuleCurrencies;
    this.blogModule = blogModule;
    this.subjectsToBlogModuleArticles = subjectsToBlogModuleArticles;
  }

  configureRoleRevocation() {
    const revocation = new RoleRevocation(this);
    this.subjectsToRoles.configureRevocation(revocation);
    return revocation;
  }

  async ecommerceModuleOrderAssertAccess(props: IEcommerceOrderAccessProps) {
    return new EcommerceOrderAccess({
      subjectsToOrders: this.subjectsToEcommerceModuleOrders,
      ordersToProducts: this.ecommerceModule.ordersToProducts,
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
      fileStorageModule: this.fileStorageModule,
    }).execute(props);
  }

  async socialModuleProfileDocumentSkillFind(
    props: IProfileDocumentSkillProps,
  ) {
    return this.getSocialModuleProfileSkillsService().forDocument(
      props.socialModuleProfileId,
      props.documentKey,
    );
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
      fileStorageModule: this.fileStorageModule,
    }).find(props.socialModuleProfileId);
  }

  async socialModuleProfileAiToolLoopRun(
    props: ISocialProfileAiToolLoopProps,
  ): Promise<ISocialProfileAiToolLoopResult> {
    return this.getSocialModuleProfileAiToolLoopService().run(props);
  }

  socialModuleProfileAiContextCreate(
    props: Omit<IAiContextServiceProps, "socialModule" | "fileStorageModule">,
  ): IAiContextService {
    return this.createSocialModuleProfileAiContextService({
      ...props,
      socialModule: this.socialModule,
      fileStorageModule: this.fileStorageModule,
    });
  }

  socialModuleProfileAiExecutionActionReporterCreate(
    props: IAiExecutionActionReporterProps,
  ): IAiExecutionActionReporter {
    return this.createSocialModuleProfileAiExecutionActionReporter(props);
  }

  billingOpenRouterSummarize(
    props: IOpenRouterBillingSummaryProps,
  ): IOpenRouterBillingSummary {
    return summarizeOpenRouterBilling(props);
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

    const thread = await this.socialModule.thread.findById({
      id: props.socialModuleThreadId,
    });

    if (!thread) {
      throw new Error("Not found error. Social module thread not found");
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const current = attempt
        ? await this.socialModule.thread.findById({ id: thread.id })
        : thread;
      const metadata = setRbacAiThreadModelPreference({
        metadata: current.metadata,
        modelId: props.modelId,
      });
      const updated = await this.socialModule.thread.update({
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
      "Thread preferences changed concurrently. Retry with the current thread.",
    );
  }

  async logout(): Promise<any> {
    return new Logout(this.repository).execute();
  }

  async recordActivity(props: IRecordActivityExecuteProps) {
    return new RecordActivity({
      update: ({ id, data }) => this.update({ id, data }),
    }).execute(props);
  }

  async init(props: IInitExecuteProps) {
    return new Init({
      findById: ({ id }) => this.findById({ id }),
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

  async authenticationLoginAndPassowrd(
    props: IAuthenticationEmailAndPasswordExecuteProps,
  ) {
    return this.completeUserAuthentication(
      await new AuthenticationEmailAndPassword(this.repository).execute(props),
    );
  }

  async authenticationEthereumVirtualMachine(
    props: IAuthenticationEthereumVirtualMachineExecuteProps,
  ) {
    return this.completeUserAuthentication(
      await new AuthenticationEthereumVirtualMachine(this.repository).execute(
        props,
      ),
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
    return this.completeUserAuthentication(
      await new AuthenticationOAuthExchange(this.repository).execute(props),
    );
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

  async authenticationMe(props: { subjectId: string }) {
    return new AuthenticationMe(this).execute(props);
  }

  protected async completeUserAuthentication<T extends { jwt: string }>(
    result: T,
  ): Promise<T> {
    if (!RBAC_JWT_SECRET)
      throw new Error("Configuration error. RBAC_JWT_SECRET not set");
    const decoded = await verify(result.jwt, RBAC_JWT_SECRET);
    const subjectId = decoded.subject?.["id"];
    if (typeof subjectId !== "string")
      throw new Error(
        "Authentication error. No Subject in authenticated session",
      );
    await this.socialModuleProfileOwnershipEnsure({ subjectId });
    await this.freeSubscriptionEnsure({ subjectId });
    return result;
  }

  async freeSubscriptionEnsure(props: { subjectId: string }) {
    await new FreeSubscription(this.getFreeSubscriptionDependencies()).execute({
      id: props.subjectId,
    });
  }

  protected getFreeSubscriptionDependencies(): IFreeSubscriptionDependencies {
    return {
      repository: this.repository,
      ecommerceModule: this.ecommerceModule,
      billingModule: this.billingModule,
      subjectsToEcommerceModuleOrders: this.subjectsToEcommerceModuleOrders,
      subjectsToIdentities: this.subjectsToIdentities,
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
        find: (findProps) => this.subjectsToIdentities.find(findProps),
      },
      {
        reason: "ecommerce-module-order",
        find: (findProps) =>
          this.subjectsToEcommerceModuleOrders.find(findProps),
      },
      {
        reason: "social-module-profile",
        find: (findProps) =>
          this.subjectsToSocialModuleProfiles.find(findProps),
      },
      {
        reason: "role",
        find: (findProps) => this.subjectsToRoles.find(findProps),
      },
      {
        reason: "billing-module-currency",
        find: (findProps) =>
          this.subjectsToBillingModuleCurrencies.find(findProps),
      },
    ];
  }

  async deanonymize(props: IDeanonymizeExecuteProps) {
    return new Deanonymize({
      findById: ({ id }) => this.findById({ id }),
      identity: this.identity,
      subjectsToIdentities: this.subjectsToIdentities,
    }).execute(props);
  }

  async ecommerceOrderCheckout(props: IEcommerceOrderCheckoutExecuteProps) {
    return new EcommerceOrderCheckout({
      findById: ({ id }) => this.findById({ id }),
      ecommerceModule: this.ecommerceModule,
      billingModule: this.billingModule,
      subjectsToEcommerceModuleOrders: this.subjectsToEcommerceModuleOrders,
    }).execute(props);
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

  async socialModuleChatLifecycleValidateDocument(props: {
    socialModuleChatId: string;
    document: unknown;
  }) {
    return this.getChatLifecycleService().validateDocument(props);
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

  async billRoute(props: IBillRouteProps) {
    return this.billRouteService.execute(props);
  }

  async billRouteSettle(props: IBillRouteSettleProps) {
    return this.billRouteService.settle(props);
  }

  async ecommerceOrderProceed(props: IEcommerceOrderProceedProps) {
    return this.ecommerceOrderProceedService.execute(props);
  }

  async telegramBootstrap(
    props: ITelegramBootstrapExecuteProps,
  ): Promise<ITelegramBootstrapResult> {
    const result = await new TelegramBootstrap({
      findById: ({ id }) => this.findById({ id }),
      identity: this.identity,
      socialModule: this.socialModule,
      subjectsToIdentities: this.subjectsToIdentities,
      subjectsToSocialModuleProfiles: this.subjectsToSocialModuleProfiles,
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
      socialModule: this.socialModule,
      subjectsToSocialModuleProfiles: this.subjectsToSocialModuleProfiles,
      ensureKnowledgeAccess: (accessProps) =>
        this.socialModuleProfileKnowledgeAccessEnsure(accessProps),
    }).execute(props);
  }

  async socialModuleProfileKnowledgeAccessEnsure(
    props: IEnsureSocialProfileKnowledgeAccessProps,
  ) {
    const result = await new SocialProfileKnowledgeAccessService({
      permission: this.permission,
      role: this.role,
      rolesToPermissions: this.rolesToPermissions,
      subjectsToRoles: this.subjectsToRoles,
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
      role: this.role,
      subjectsToRoles: this.subjectsToRoles,
      rolesToEcommerceModuleProducts: this.rolesToEcommerceModuleProducts,
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

  protected getSocialModuleProfileSkillsService() {
    return new ProfileSkills(this.socialModule);
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
  ISocialModuleProfileDocumentSkillFindProps,
  IEcommerceProductCheckoutProps,
  IAiContextService,
  IAiContextServiceProps,
  IAiContextPrepareProps,
  IAiContextPreparation,
  IAiContextHistoryMessage,
  IAiExecutionActionReporter,
  IAiExecutionActionReporterProps,
  IOpenRouterBillingLedgerEntry,
  IOpenRouterBillingSummary,
  IProfileMcpCatalogSession,
  ISocialProfileAiTool,
  ISocialProfileAiToolLoopProps,
  ISocialProfileAiToolLoopResult,
  TOpenRouterBillingPurpose,
} from "./public-contract";
