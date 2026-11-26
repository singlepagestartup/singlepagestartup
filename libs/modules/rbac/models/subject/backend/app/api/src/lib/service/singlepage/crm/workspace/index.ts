import {
  isStoreEmployeeTraining,
  type IModel as ITask,
} from "@sps/crm/models/task/sdk/model";
import {
  funnelDefinitionSchema,
  needsStageWorkFunding,
  stageWorkFunding,
  stageWorkModelSelection,
  type IFunnelBindings,
  type IModel as IFunnel,
} from "@sps/crm/models/funnel/sdk/model";
import type {
  ICrmWorkspaceConversation,
  ICrmWorkspaceOrderPage,
  ICrmWorkspaceCustomerQuery,
  ICrmWorkspaceCustomerPage,
  ICrmWorkspaceOrderDetail,
  ICrmWorkspaceOrderQuery,
  ICrmWorkspaceEmployeeDetailQuery,
  ICrmWorkspaceEmployeePage,
  ICrmWorkspaceEmployeeProfile,
  ICrmWorkspaceOptions,
  ICrmWorkspaceFunnelProductsQuery,
  ICrmWorkspaceOverview,
  ICrmWorkspaceParticipant,
  ICrmWorkspaceOffer,
  ICrmWorkspaceProduct,
  ICrmWorkspaceFunnelBySlugQuery,
  ICrmWorkspaceFunnelQuery,
  ICrmWorkspaceTaskDetail,
  ICrmWorkspaceTaskDetailQuery,
  ICrmWorkspaceTaskQuery,
  ICrmWorkspaceThreadMessage,
  ICrmWorkspaceThreadQuery,
  TCrmWorkspaceCommand,
} from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import {
  orderResultFiles,
  type IOrderWorkView,
} from "@sps/rbac/models/subject/sdk/model/src/lib/order-work";
import { canDiscussCompletedOrder } from "@sps/rbac/models/subject/sdk/model";
import type { IModel as IStore } from "@sps/ecommerce/models/store/sdk/model";
import { deliveredOrderWorkFile } from "@sps/ecommerce/models/order/sdk/model";
import { getEligibleRetailOffers } from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { Service as Subject } from "../../index";
import { criteria } from "../../ecommerce/customer-work/utils";
import { Service as SocialActions } from "../../social-module/chat/actions";
import { Service as SocialMessages } from "../../social-module/chat/messages";
import { Service as SocialParticipants } from "../../social-module/chat/participants";
import { Service as OrderContents } from "./order-contents";
import { Service as Employees } from "./employees";
import { Service as AssignmentCandidates } from "./assignment-candidates";
import { Service as ChatSettings } from "./chat-settings";

const managerRoles = ["crm-manager", "crm-manager-finance"];
const managerVariants = new Set(["owner", ...managerRoles]);
const employeeVariants = [...managerRoles, "crm-worker", "crm-agent"];
const workerVariants = new Set(["owner", ...employeeVariants]);

export class Service {
  constructor(readonly subject: Subject) {}

  get employees() {
    return new Employees(this.subject);
  }

  get chatSettings() {
    return new ChatSettings(this.subject);
  }

  async taskChatCandidates(storeId: string) {
    const grants = await this.grants({ storeId });
    const employees = new Map<string, boolean>();
    for (const { subjectId, variant } of grants) {
      if (workerVariants.has(variant)) {
        employees.set(
          subjectId,
          employees.get(subjectId) || variant === "crm-agent",
        );
      }
    }
    const candidates = await Promise.all(
      [...employees].map(async ([subjectId, agent]) => {
        const profileId = agent
          ? (await this.employees.employee(storeId, subjectId))?.profileId
          : (await this.employees.human(subjectId))?.profile?.id;
        if (profileId) {
          return { subjectId, profileId, agent };
        }
        return undefined;
      }),
    );
    return candidates.filter((candidate) => candidate !== undefined);
  }

  private async grants(input: { subjectId?: string; storeId?: string }) {
    const and: {
      column: "subjectId" | "ecommerceModuleStoreId";
      method: "eq";
      value: string;
    }[] = [];
    if (input.subjectId) {
      and.push({ column: "subjectId", method: "eq", value: input.subjectId });
    }
    if (input.storeId) {
      and.push({
        column: "ecommerceModuleStoreId",
        method: "eq",
        value: input.storeId,
      });
    }

    return this.subject.module.subjectsToEcommerceModuleStores.find({
      params: { filters: { and } },
    });
  }

  async assertFulfillmentStaff(actorId: string, storeId: string) {
    const grants = await this.grants({ subjectId: actorId, storeId });
    if (
      !grants.some(
        ({ variant }) =>
          variant === "crm-worker" || managerVariants.has(variant),
      )
    ) {
      throw new Error(
        "Permission error. Store staff access required to record fulfillment",
      );
    }
  }

  private async access(actorId: string, storeId: string) {
    const access = await this.taskAccess(actorId, storeId);
    if (!access.canManageTasks) {
      throw new Error("Permission error. Store CRM access is required");
    }
    return access;
  }

  async hasHandoffManager(storeId: string, customerId: string) {
    const grants = await this.grants({ storeId });
    const ids = new Set(
      grants
        .filter(
          ({ ecommerceModuleStoreId, subjectId, variant }) =>
            ecommerceModuleStoreId === storeId &&
            subjectId !== customerId &&
            managerVariants.has(variant),
        )
        .map(({ subjectId }) => subjectId),
    );
    const managers = await Promise.all(
      [...ids].map((id) => this.subject.findById({ id })),
    );
    return managers.some(
      (manager) =>
        manager &&
        manager.variant !== "agent" &&
        manager.variant !== "anonymous",
    );
  }

  async stores(actorId: string, storeSlug?: string, tasks?: boolean) {
    const storeService = this.subject.modules.ecommerce.store;
    let exactStore: IStore | undefined;
    if (storeSlug !== undefined) {
      [exactStore] = await storeService.find({
        params: {
          limit: 1,
          filters: {
            and: [{ column: "slug", method: "eq", value: storeSlug }],
          },
        },
      });
      if (!exactStore) {
        return [];
      }
    }

    const [grants, admin] = await Promise.all([
      this.grants({ subjectId: actorId, storeId: exactStore?.id }),
      this.subject.isAdmin(actorId),
    ]);
    const storeIds = [
      ...new Set(
        grants
          .filter((grant) => managerVariants.has(grant.variant))
          .map((grant) => grant.ecommerceModuleStoreId),
      ),
    ];
    const assignedWorker =
      tasks &&
      exactStore &&
      grants.some(({ variant }) => variant === "crm-worker");
    if (!admin && !storeIds.length && !assignedWorker) {
      return [];
    }

    let stores: IStore[];
    if (exactStore) {
      stores = [exactStore];
    } else if (admin) {
      stores = await storeService.find({ params: { limit: 100 } });
    } else {
      const grantedStores = await storeService.find({
        params: {
          filters: {
            and: [{ column: "id", method: "inArray", value: storeIds }],
          },
        },
      });
      const byId = new Map(grantedStores.map((store) => [store.id, store]));
      stores = storeIds.flatMap((id) => byId.get(id) ?? []);
    }
    const rows = stores.map((store) => {
      const storeGrants = grants.filter(
        ({ ecommerceModuleStoreId }) => ecommerceModuleStoreId === store.id,
      );
      const owner = storeGrants.some(({ variant }) => variant === "owner");
      return {
        id: store.id,
        title: store.title?.ru || store.title?.en || store.adminTitle,
        slug: store.slug,
        canManageTasks:
          admin ||
          storeGrants.some(({ variant }) => managerVariants.has(variant)),
        canManageCatalog: owner || admin,
        canManageEmployees: owner || admin,
        canManageProviderSettings: owner,
        canReadCosts:
          owner ||
          admin ||
          storeGrants.some(({ variant }) => variant === "crm-manager-finance"),
      };
    });
    if (exactStore || !rows.length) {
      return rows;
    }
    const ids = rows.map(({ id }) => id);
    const costVisibleIds = rows
      .filter(({ canReadCosts }) => canReadCosts)
      .map(({ id }) => id);
    const [products, employees] = await Promise.all([
      this.subject.repository.storeProductCounts(ids, costVisibleIds),
      this.subject.repository.storeEmployeeCounts(ids, employeeVariants),
    ]);
    const productCounts = new Map(
      products.map(({ storeId, count }) => [storeId, count]),
    );
    const employeeCounts = new Map(
      employees.map(({ storeId, count }) => [storeId, count]),
    );
    return rows.map((row) => ({
      ...row,
      productCount: productCounts.get(row.id) ?? 0,
      employeeCount: employeeCounts.get(row.id) ?? 0,
    }));
  }

  async overview(
    actorId: string,
    storeId: string,
  ): Promise<ICrmWorkspaceOverview> {
    const { canReadCosts } = await this.access(actorId, storeId);
    const [products, orderCount, taskCount] = await Promise.all([
      this.subject.repository.storeProductCounts(
        [storeId],
        canReadCosts ? [storeId] : [],
      ),
      this.subject.repository.storeOrderCount(storeId),
      this.subject.modules.crm.funnel.storeTaskCount(storeId),
    ]);
    return { productCount: products[0]?.count ?? 0, orderCount, taskCount };
  }

  async orders(
    actorId: string,
    input: {
      storeId: string;
      offset: number;
      limit: number;
      search?: string;
      customerId?: string;
    },
  ): Promise<ICrmWorkspaceOrderPage> {
    const { canReadCosts } = await this.access(actorId, input.storeId);
    const { items, total } = await this.subject.repository.storeOrders(input);
    let summaries: Awaited<ReturnType<OrderContents["summaries"]>> | undefined;
    if (input.customerId) {
      summaries = await new OrderContents(this.subject).summaries(
        input.storeId,
        items,
        canReadCosts,
      );
    }
    return {
      items: items.map(({ id, status, createdAt }) => ({
        id,
        status,
        createdAt: createdAt.toISOString(),
        ...summaries?.get(id),
      })),
      total,
      nextOffset:
        input.offset + input.limit < total
          ? input.offset + input.limit
          : undefined,
    };
  }

  async storeOrderAccess(actorId: string, storeId: string, orderId: string) {
    const { canReadCosts } = await this.access(actorId, storeId);
    const order = await this.subject.repository.storeOrder(storeId, orderId);
    if (!order) {
      throw new Error("Not Found error. Order not found in this store");
    }
    return { order, canReadCosts };
  }

  async order(
    actorId: string,
    { storeId, orderId }: ICrmWorkspaceOrderQuery,
  ): Promise<ICrmWorkspaceOrderDetail> {
    const { order, canReadCosts } = await this.storeOrderAccess(
      actorId,
      storeId,
      orderId,
    );
    const [contents, ownership, linkedTasks] = await Promise.all([
      new OrderContents(this.subject).read(storeId, orderId, canReadCosts),
      this.subject.module.subjectsToEcommerceModuleOrders.find(
        criteria({ ecommerceModuleOrderId: orderId }),
      ),
      this.subject.modules.crm.task.find(criteria({ storeId, orderId })),
    ]);
    const tasks = await this.taskRows(
      linkedTasks.filter((task) => !isStoreEmployeeTraining(task.openingKey)),
    );
    const customerIds = new Set(
      ownership.length
        ? ownership.map(({ subjectId }) => subjectId)
        : tasks.map(({ customerId }) => customerId),
    );
    const customers = await Promise.all(
      Array.from(customerIds, async (subjectId) => {
        const [link] =
          await this.subject.module.subjectsToSocialModuleProfiles.find(
            criteria({ subjectId, variant: "default" }),
          );
        const profile =
          link &&
          (await this.subject.modules.social.profile.findById({
            id: link.socialModuleProfileId,
          }));
        const task = tasks.find((task) => task.customerId === subjectId);
        const name =
          task?.customerName ||
          (await this.subject.findById({ id: subjectId }))?.slug ||
          subjectId;
        return {
          subjectId,
          name,
          profile: profile
            ? {
                slug: profile.slug,
                title: profile.title,
                subtitle: profile.subtitle,
              }
            : undefined,
        };
      }),
    );
    return {
      ...order,
      ...contents,
      createdAt: order.createdAt.toISOString(),
      customers,
      tasks: tasks.map(({ id, label }) => ({ id, label })),
    };
  }

  async customers(
    actorId: string,
    input: { storeId: string; offset: number; limit: number; search?: string },
  ): Promise<ICrmWorkspaceCustomerPage> {
    await this.access(actorId, input.storeId);
    return this.subject.repository.storeCustomers(input);
  }

  async customer(actorId: string, input: ICrmWorkspaceCustomerQuery) {
    await this.access(actorId, input.storeId);
    const { items } = await this.subject.repository.storeCustomers({
      ...input,
      offset: 0,
      limit: 1,
    });
    if (!items.length) {
      throw new Error("Not Found error. Customer not found in this store");
    }
    return items[0];
  }

  async employeeList(
    actorId: string,
    input: { storeId: string; offset: number; limit: number; search?: string },
  ): Promise<ICrmWorkspaceEmployeePage> {
    await this.access(actorId, input.storeId);
    return this.subject.repository.storeEmployees({
      ...input,
      employeeVariants,
    });
  }

  async employeeDetail(
    actorId: string,
    { storeId, subjectId }: ICrmWorkspaceEmployeeDetailQuery,
  ): Promise<ICrmWorkspaceEmployeeProfile> {
    const { canManageTasks } = await this.taskAccess(actorId, storeId);
    if (!canManageTasks && actorId !== subjectId) {
      throw new Error("Permission error. Store employee access is required");
    }
    const grants = await this.grants({ storeId, subjectId });
    if (grants.some(({ variant }) => variant === "crm-agent")) {
      const employee = await this.storeAgent(storeId, subjectId);
      if (employee) {
        const canManage = await this.employees.canManage(actorId, storeId);
        const managed =
          canManage && (await this.employees.employee(storeId, subjectId));
        const training = managed
          ? await this.employees.currentChat(actorId, storeId, subjectId)
          : undefined;
        return {
          id: employee.id,
          name: employee.name,
          kind: "ai",
          canTrain: Boolean(managed),
          ...(training && { training }),
        };
      }
    }
    if (grants.some(({ variant }) => workerVariants.has(variant))) {
      const employee = await this.employees.human(subjectId);
      if (employee) {
        return {
          id: subjectId,
          name: employee.name,
          kind: "human",
          canTrain: false,
        };
      }
    }
    const assistant = grants.find(({ variant }) => variant === "assistant");
    if (assistant?.customerSubjectId) {
      const assigned = await this.subject.modules.crm.task.list({
        storeId,
        assigneeId: subjectId,
        customerId: assistant.customerSubjectId,
        limit: 1,
      });
      if (assigned.items.length) {
        return {
          id: subjectId,
          name: "Личный ассистент",
          kind: "ai",
          canTrain: false,
        };
      }
    }
    throw new Error("Not Found error. Store employee is unavailable");
  }

  private async skillsForAssignee(profileId?: string) {
    if (!profileId) {
      return [];
    }
    const skills =
      await this.subject.modules.social.profilesToSkills.linkedSkills(
        profileId,
      );
    return skills.map(({ id, title }) => ({ id, title }));
  }

  async options(
    actorId: string,
    storeId: string,
    includeCatalogue = true,
  ): Promise<ICrmWorkspaceOptions> {
    const { canManageEmployees } = await this.access(actorId, storeId);
    const [grants, currencies, catalogue] = await Promise.all([
      this.grants({ storeId }),
      this.subject.modules.billing.currency.find({ params: { limit: 100 } }),
      includeCatalogue ? this.catalogue(storeId, true) : undefined,
    ]);
    const humanWorkers = new Set<string>();
    const agentWorkers = new Set<string>();
    for (const grant of grants) {
      if (workerVariants.has(grant.variant)) {
        const workers =
          grant.variant === "crm-agent" ? agentWorkers : humanWorkers;
        workers.add(grant.subjectId);
      }
    }
    const workers = new Set([...humanWorkers, ...agentWorkers]);
    const candidates = await Promise.all(
      [...workers].map(async (id) => {
        if (agentWorkers.has(id)) {
          const agent = await this.storeAgent(storeId, id);
          if (agent) {
            return agent;
          }
        }
        if (!humanWorkers.has(id)) {
          return undefined;
        }
        const person = await this.subject.findById({ id });
        if (
          !person ||
          person.variant === "agent" ||
          person.variant === "anonymous"
        ) {
          return undefined;
        }
        return {
          id,
          name: person.slug || id,
          kind: "human" as const,
        };
      }),
    );
    const ownerIds = new Set(
      grants
        .filter((grant) => grant.variant === "owner")
        .map((grant) => grant.subjectId),
    );
    const people = candidates.filter((candidate) => candidate !== undefined);
    const agents = people.filter((person) => person.kind === "ai");
    const [skills, employees] = await Promise.all([
      Promise.all(
        agents.map(
          async ({ id, profileId }) =>
            [id, await this.skillsForAssignee(profileId)] as const,
        ),
      ),
      canManageEmployees
        ? this.employees.list(
            storeId,
            agents.map(({ id }) => id),
          )
        : [],
    ]);
    const participants = people.map(({ id, name, kind }) => ({
      id,
      name,
      kind,
    }));
    return {
      participants,
      canManageEmployees,
      employees,
      ...catalogue,
      payers: participants.filter((person) => ownerIds.has(person.id)),
      skillsByAssignee: Object.fromEntries(skills),
      currencies: currencies.map((currency) => ({
        id: currency.id,
        slug: currency.slug,
        title: currency.title,
        units: currency.minorUnitDigits,
      })),
    };
  }

  async funnelProducts(
    actorId: string,
    input: ICrmWorkspaceFunnelProductsQuery,
  ) {
    await this.access(actorId, input.storeId);
    const { items, total } =
      await this.subject.repository.storeFunnelProducts(input);
    const language = input.language;
    const products = items.map((product) => ({
      id: product.id,
      title:
        product.title?.[language] ||
        product.title?.ru ||
        product.title?.en ||
        product.adminTitle,
    }));
    return { items: products, total };
  }

  private async catalogue(storeId: string, includeHidden: boolean) {
    const ecommerce = this.subject.modules.ecommerce;
    const variants = includeHidden ? ["default", "hidden"] : ["default"];
    const offers = await ecommerce.storesToProducts.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            { column: "variant", method: "inArray", value: variants },
          ],
        },
      },
    });
    const offersByProduct = new Map<string, typeof offers>();
    for (const offer of offers) {
      const productOffers = offersByProduct.get(offer.productId) ?? [];
      productOffers.push(offer);
      offersByProduct.set(offer.productId, productOffers);
    }
    const productIds = [...offersByProduct.keys()];
    const products = productIds.length
      ? await ecommerce.product.find({
          params: {
            filters: {
              and: [
                { column: "id", method: "inArray", value: productIds },
                { column: "variant", method: "eq", value: "default" },
              ],
            },
          },
        })
      : [];
    const retailOffers: ICrmWorkspaceOffer[] = [];
    const selectableProducts: ICrmWorkspaceProduct[] = [];
    for (const product of products) {
      const title =
        product.title?.ru || product.title?.en || product.adminTitle;
      const productOffers = offersByProduct.get(product.id) ?? [];
      if (
        productOffers.some(({ settings }) => settings?.initialGrant !== true)
      ) {
        selectableProducts.push({ id: product.id, title });
      }
      const eligible = getEligibleRetailOffers({
        offers: productOffers,
        product,
        storeId,
      });
      for (const offer of eligible) {
        retailOffers.push({
          id: offer.id,
          productId: product.id,
          title,
          kind: product.kind === "service" ? "service" : "physical",
          requiresResultAcceptance:
            product.type === "one_off" &&
            offer.settings.requiresResultAcceptance === true,
        });
      }
    }
    return { offers: retailOffers, products: selectableProducts };
  }

  private async boundOffers(storeId: string, offerIds: string[]) {
    if (!offerIds.length) {
      return new Map<string, string>();
    }
    const rows = await this.subject.modules.ecommerce.storesToProducts.find({
      params: {
        filters: {
          and: [
            { column: "storeId", method: "eq", value: storeId },
            { column: "id", method: "inArray", value: offerIds },
          ],
        },
      },
    });
    return new Map(rows.map(({ id, productId }) => [id, productId]));
  }

  private async withLinkedProducts(funnel: IFunnel) {
    const { storeId, bindings } = funnel;
    const boundOffers = await this.boundOffers(storeId, bindings.offerIds);
    const boundProductIds = new Set(boundOffers.values());
    const productIds = [
      ...new Set([...bindings.productIds, ...boundProductIds]),
    ];
    if (!productIds.length) {
      return { ...funnel, linkedProducts: [] };
    }
    const ecommerce = this.subject.modules.ecommerce;
    const directOnly = bindings.productIds.filter(
      (id) => !boundProductIds.has(id),
    );
    const directOffers = directOnly.length
      ? await ecommerce.storesToProducts.find({
          params: {
            filters: {
              and: [
                { column: "storeId", method: "eq", value: storeId },
                { column: "productId", method: "inArray", value: directOnly },
              ],
            },
          },
        })
      : [];
    const ids = [
      ...new Set([
        ...boundProductIds,
        ...directOffers.map(({ productId }) => productId),
      ]),
    ];
    const products = ids.length
      ? await ecommerce.product.find({
          params: {
            filters: { and: [{ column: "id", method: "inArray", value: ids }] },
          },
        })
      : [];
    const linked = new Map(
      products.map(({ id, title, adminTitle }) => [
        id,
        {
          id,
          title: title?.ru || title?.en || adminTitle,
          localizedTitle: title ?? undefined,
        },
      ]),
    );
    return {
      ...funnel,
      linkedProducts: productIds.map((id) => linked.get(id) ?? { id }),
    };
  }

  private async storeAgent(storeId: string, subjectId: string) {
    const grants = await this.grants({ subjectId });
    if (
      !grants.some(
        (grant) =>
          grant.variant === "crm-agent" &&
          grant.ecommerceModuleStoreId === storeId,
      ) ||
      grants.some(({ variant }) => variant === "assistant")
    ) {
      return undefined;
    }
    const agent = await this.subject.findById({ id: subjectId });
    if (agent?.variant !== "agent") {
      return undefined;
    }
    const profile = await this.employees.agentProfile(subjectId);
    const name = profile ? this.employees.name(profile) : agent.slug;
    return {
      id: subjectId,
      name,
      kind: "ai" as const,
      profileId: profile?.id,
      profile,
    };
  }

  async funnels(actorId: string, input: ICrmWorkspaceFunnelQuery) {
    await this.access(actorId, input.storeId);
    return this.subject.modules.crm.funnel.list(input);
  }

  async productFunnels(
    actorId: string,
    input: { storeId: string; productId: string; offerIds: string[] },
  ) {
    await this.access(actorId, input.storeId);
    const funnels =
      await this.subject.modules.crm.funnel.linkedToProduct(input);
    return funnels;
  }

  async funnel(actorId: string, input: ICrmWorkspaceFunnelBySlugQuery) {
    await this.access(actorId, input.storeId);
    const funnel = await this.subject.modules.crm.funnel.getBySlug(input, true);
    return this.withLinkedProducts(funnel);
  }

  private async taskRows(tasks: ITask[], knownChatId?: string | null) {
    const subjectIds = new Set<string>();
    const humanAssignees = new Set<string>();
    const aiAssignees = new Map<string, string>();
    const productIds = new Set<string>();
    for (const task of tasks) {
      subjectIds.add(task.customerId);
      if (task.assigneeId) {
        if (task.assigneeKind === "ai") {
          aiAssignees.set(task.assigneeId, task.storeId);
        } else {
          humanAssignees.add(task.assigneeId);
          subjectIds.add(task.assigneeId);
        }
      }
      if (task.productId) {
        productIds.add(task.productId);
      }
    }

    const [people, agents, products, customers] = await Promise.all([
      Promise.all(
        [...subjectIds].map(async (id) => {
          if (humanAssignees.has(id)) {
            const employee = await this.employees.human(id);
            return [
              id,
              { name: employee?.name, profileId: employee?.profile?.id },
            ] as const;
          }
          const person = await this.subject.findById({ id });
          return [id, { name: person?.slug, profileId: undefined }] as const;
        }),
      ),
      Promise.all(
        [...aiAssignees].map(async ([id, storeId]) => {
          const worker = await this.storeAgent(storeId, id);
          return [
            id,
            {
              name: worker?.name ?? "Личный ассистент",
              profileId: worker?.profileId,
            },
          ] as const;
        }),
      ),
      Promise.all(
        [...productIds].map(async (id) => {
          const product = await this.subject.modules.ecommerce.product.findById(
            { id },
          );
          return [
            id,
            product?.title?.ru || product?.title?.en || product?.adminTitle,
          ] as const;
        }),
      ),
      Promise.all(
        tasks.map(async (task) => {
          const name = await this.subject.customerWork.workspaceCustomerName(
            task,
            knownChatId,
          );
          return [task.id, name] as const;
        }),
      ),
    ]);
    const names = new Map(people);
    const agentNames = new Map(agents);
    const profileIds = new Set(
      [...people, ...agents].flatMap(([, person]) =>
        person.profileId ? [person.profileId] : [],
      ),
    );
    const profiles = await Promise.all(
      [...profileIds].map((id) =>
        this.subject.modules.social.profile.profilePresentation({ id }),
      ),
    );
    const assigneeProfiles = new Map(
      profiles.flatMap((profile) =>
        profile
          ? [
              [
                profile.id,
                {
                  id: profile.id,
                  title: profile.title,
                  avatar: profile.avatar,
                },
              ] as const,
            ]
          : [],
      ),
    );
    const productTitles = new Map(products);
    const customerNames = new Map(customers);

    return tasks.map(({ publicationId: _publicationId, ...task }) => {
      const assigneeNames = task.assigneeKind === "ai" ? agentNames : names;
      const assignee = task.assigneeId
        ? assigneeNames.get(task.assigneeId)
        : undefined;
      return {
        ...task,
        label:
          (task.productId && productTitles.get(task.productId)) ||
          `Задача ${task.id.slice(0, 8)}`,
        customerName:
          customerNames.get(task.id) ||
          names.get(task.customerId)?.name ||
          task.customerId,
        assigneeName: assignee?.name,
        assigneeProfile: assignee?.profileId
          ? assigneeProfiles.get(assignee.profileId)
          : undefined,
      };
    });
  }

  async taskAccess(actorId: string, storeId: string) {
    const [grants, admin] = await Promise.all([
      this.grants({ subjectId: actorId, storeId }),
      this.subject.isAdmin(actorId),
    ]);
    const canManageTasks =
      admin || grants.some(({ variant }) => managerVariants.has(variant));
    const canReadCosts =
      admin ||
      grants.some(
        ({ variant }) =>
          variant === "owner" || variant === "crm-manager-finance",
      );
    if (
      !canManageTasks &&
      !grants.some(({ variant }) => variant === "crm-worker")
    ) {
      throw new Error("Permission error. Store CRM access is required");
    }
    const canManageEmployees =
      admin || grants.some(({ variant }) => variant === "owner");
    return { canManageTasks, canReadCosts, canManageEmployees };
  }

  async canParticipateInChat(actorId: string, task: ITask, chatId: string) {
    if (isStoreEmployeeTraining(task.openingKey)) {
      return false;
    }
    const grants = await this.grants({
      subjectId: actorId,
      storeId: task.storeId,
    });
    if (
      grants.some(({ variant }) => managerVariants.has(variant)) ||
      (await this.subject.isAdmin(actorId))
    ) {
      return true;
    }
    if (!grants.some(({ variant }) => variant === "crm-worker")) {
      return false;
    }
    if (task.assigneeKind === "human" && task.assigneeId === actorId) {
      return true;
    }
    const [profiles, members] = await Promise.all([
      this.subject.module.subjectsToSocialModuleProfiles.find(
        criteria({ subjectId: actorId, variant: "default" }),
      ),
      this.subject.modules.social.profilesToChats.find(
        criteria({ chatId, variant: "participant" }),
      ),
    ]);
    return profiles.some(({ socialModuleProfileId }) =>
      members.some(({ profileId }) => profileId === socialModuleProfileId),
    );
  }

  private async attachTaskParticipants(
    actorId: string,
    task: ITask,
    participantIds: string[],
  ) {
    return this.subject.modules.crm.task.withTask(
      { storeId: task.storeId, taskId: task.id },
      async (locked) => {
        const channel = await this.subject.customerWork.ensureWorkspaceChannel(
          actorId,
          locked,
        );
        if (participantIds.some((id) => id !== actorId)) {
          await this.subject.chatOwnership.assertOwner(actorId, channel.chatId);
        }
        const relation = this.subject.modules.social.profilesToChats;
        const people = participantIds.length
          ? (await this.options(actorId, locked.storeId)).participants
          : [];
        for (const id of new Set([actorId, ...participantIds])) {
          const person = people.find((candidate) => candidate.id === id);
          if (id !== actorId && !person) {
            throw new Error(
              "Validation error. Choose an employee of this store",
            );
          }
          const profileId =
            person?.kind === "ai"
              ? (await this.storeAgent(locked.storeId, id))?.profileId
              : await this.employees.ensureActorProfile(id);
          if (!profileId) {
            throw new Error("Conflict error. The employee has no profile");
          }
          const [member] = await relation.find(
            criteria({ chatId: channel.chatId, profileId }),
          );
          if (!member) {
            await relation.create({
              data: {
                chatId: channel.chatId,
                profileId,
                variant: participantIds.includes(id)
                  ? "participant"
                  : "default",
              },
            });
          } else if (
            participantIds.includes(id) &&
            member.variant !== "participant"
          ) {
            await relation.update({
              id: member.id,
              data: { variant: "participant" },
            });
          }
        }
        return {
          id: locked.id,
          chatId: channel.chatId,
          threadId: channel.threadId,
        };
      },
    );
  }

  private async assertTaskAccess(
    task: ITask,
    actorId: string,
    canManageTasks: boolean,
  ) {
    this.assertWorkspaceTask(task);
    if (
      canManageTasks ||
      (task.assigneeId === actorId && task.assigneeKind === "human")
    ) {
      return;
    }
    const channel = await this.subject.customerWork.workspaceChannel(task);
    if (
      channel &&
      (await this.canParticipateInChat(actorId, task, channel.chatId))
    ) {
      return;
    }
    throw new Error("Not Found error. CRM task is unavailable");
  }

  async intake(actorId: string, storeId: string) {
    await this.taskAccess(actorId, storeId);
    const { offers } = await this.catalogue(storeId, false);
    return offers;
  }

  async tasks(actorId: string, input: ICrmWorkspaceTaskQuery) {
    const { includeStageNames, ...filters } = input;
    const { canManageTasks } = await this.taskAccess(actorId, input.storeId);
    const visible = canManageTasks
      ? undefined
      : await this.subject.repository.workspaceStaffTaskIds(actorId);
    const page = await this.subject.modules.crm.task.list(filters, visible);
    const scoped = page.items;
    const [rows, stages] = await Promise.all([
      this.taskRows(scoped),
      includeStageNames ? this.stageNames(input.storeId, scoped) : undefined,
    ]);
    const items = stages
      ? rows.map((task) => ({
          ...task,
          stageName: stages.get(task.funnelId)?.get(task.stageId),
        }))
      : rows;
    return { items, nextCursor: page.nextCursor };
  }

  private async stageNames(storeId: string, tasks: ITask[]) {
    const funnelIds = new Set(tasks.map(({ funnelId }) => funnelId));
    const entries = await Promise.all(
      [...funnelIds].map(async (funnelId) => {
        const funnel = await this.subject.modules.crm.funnel.current(
          storeId,
          funnelId,
        );
        const stages = new Map(
          funnel.definition.stages.map(({ id, name }) => [id, name]),
        );
        return [funnelId, stages] as const;
      }),
    );
    return new Map(entries);
  }

  async detail(actorId: string, input: ICrmWorkspaceTaskDetailQuery) {
    const { canReadCosts, canManageTasks } = await this.taskAccess(
      actorId,
      input.storeId,
    );
    const tasks = this.subject.modules.crm.task;
    const task = await tasks.get(input);
    await this.assertTaskAccess(task, actorId, canManageTasks);
    const [
      funnel,
      history,
      channel,
      stageStates,
      visitedStageIds,
      awaitingManager,
    ] = await Promise.all([
      tasks.getFunnel(input),
      tasks.history(input),
      this.subject.customerWork.workspaceChannel(task),
      this.subject.modules.crm.tasksToStages.stageStates(task.id),
      this.subject.modules.crm.tasksToStages.visitedStageIds(
        task.id,
        task.revision,
      ),
      this.subject.customerWork.isAwaitingManager(task),
    ]);
    const [shown] = await this.taskRows([task], channel?.chatId ?? null);
    let order: ICrmWorkspaceTaskDetail["order"];
    if (task.orderId) {
      const entity = await this.subject.modules.ecommerce.order.findById({
        id: task.orderId,
      });
      if (entity) {
        order = { id: entity.id, status: entity.status, paymentStatus: null };
        const work = await this.taskOrderWork(task);
        if (work?.paid) {
          order.paymentStatus = "paid";
        }
        if (work?.kind === "individual-service") {
          order.workState = work.state;
          order.originalDelivered = Boolean(deliveredOrderWorkFile(work));
        }
        if (work?.kind === "physical-order") {
          order.fulfillment = {
            state: work.state,
            trackingNumber: work.fulfillment.find(
              (event) => event.stage === "in-transit",
            )?.trackingNumber,
            canFulfill:
              task.assigneeId === actorId &&
              task.assigneeKind === "human" &&
              Boolean(work.paid),
          };
        }
      }
    }
    let thread: ICrmWorkspaceTaskDetail["thread"];
    if (channel) {
      const [profile] =
        await this.subject.module.subjectsToSocialModuleProfiles.find(
          criteria({ subjectId: actorId, variant: "default" }),
        );
      thread = {
        id: channel.threadId,
        title: channel.title || "Обсуждение задачи",
        chatId: channel.chatId,
        canSend:
          canManageTasks ||
          task.status !== "closed" ||
          canDiscussCompletedOrder(task),
        actorProfileId:
          profile &&
          (
            await this.subject.modules.social.profilesToChats.find(
              criteria({
                chatId: channel.chatId,
                profileId: profile.socialModuleProfileId,
              }),
            )
          ).length
            ? profile.socialModuleProfileId
            : undefined,
      };
    }
    const assignmentCandidates = canManageTasks
      ? await this.assignmentCandidates(actorId, task, channel)
      : undefined;
    let costs:
      | {
          id: string;
          title: string;
          status: string;
          amount: string;
          transfer?: string;
        }[]
      | undefined;
    if (canReadCosts) {
      const { items: receipts } =
        await this.subject.modules.billing.transaction.history(
          input.storeId,
          undefined,
          input.taskId,
        );
      const currencies = new Map(
        await Promise.all(
          [...new Set(receipts.map((receipt) => receipt.currencyId))].map(
            async (id) => {
              const currency =
                await this.subject.modules.billing.currency.findById({ id });
              return [id, currency?.symbol || currency?.title || id] as const;
            },
          ),
        ),
      );
      const states = {
        held: "Зарезервировано",
        released: "Возвращено",
        settled: "Рассчитано",
        posted: "Проведено",
      };
      costs = receipts.map((receipt) => ({
        id: receipt.id,
        title: receipt.kind === "transfer" ? "Перевод" : "Резерв средств",
        status: states[receipt.state],
        amount: `${receipt.amount} ${currencies.get(receipt.currencyId)}`,
        transfer:
          receipt.kind === "transfer"
            ? `${receipt.senderWalletId} → ${receipt.recipientWalletId}`
            : undefined,
      }));
    }
    const assignmentEvents = history.items.some(
      ({ kind }) => kind === "assigned",
    )
      ? await this.subject.modules.crm.tasksToStages.find(
          criteria({ taskId: task.id, kind: "assigned" }),
        )
      : [];
    const assigneeIds = [
      ...new Set(
        assignmentEvents.flatMap(({ detail }) =>
          detail.assigneeId ? [detail.assigneeId] : [],
        ),
      ),
    ];
    const assigneeNames = new Map(
      await Promise.all(
        assigneeIds.map(async (id) => {
          const [worker, person] = await Promise.all([
            this.storeAgent(task.storeId, id),
            this.subject.findById({ id }),
          ]);
          return [
            id,
            worker?.name ??
              (person?.variant === "agent" ? "Личный ассистент" : person?.slug),
          ] as const;
        }),
      ),
    );
    const assignments = new Map(
      assignmentEvents.map(({ detail }) => [
        detail.assignmentRevision,
        detail.assigneeId,
      ]),
    );
    return {
      task: shown,
      funnel,
      stageStates,
      visitedStageIds,
      awaitingManager,
      history: {
        ...history,
        items: history.items.map(({ detail, ...event }) => {
          const {
            publicationId: _publicationId,
            previousPublicationId: _previousPublicationId,
            ...shown
          } = detail;
          if (event.kind === "migrated") {
            return { ...event, detail: { ...shown, reason: undefined } };
          }
          const previousAssigneeId =
            event.kind === "assigned" && detail.assignmentRevision
              ? assignments.get(detail.assignmentRevision - 1)
              : undefined;
          return {
            ...event,
            detail: shown,
            assigneeName: detail.assigneeId
              ? assigneeNames.get(detail.assigneeId)
              : undefined,
            previousAssigneeName:
              previousAssigneeId && previousAssigneeId !== detail.assigneeId
                ? assigneeNames.get(previousAssigneeId)
                : undefined,
          };
        }),
      },
      order,
      thread,
      assignmentCandidates,
      costs,
      canManageTasks,
    };
  }

  private async assignmentCandidates(
    actorId: string,
    task: ITask,
    channel: Awaited<ReturnType<Subject["customerWork"]["workspaceChannel"]>>,
  ) {
    let candidates: ICrmWorkspaceParticipant[];
    if (channel) {
      candidates = await new AssignmentCandidates(this.subject).read(
        task,
        channel,
      );
    } else {
      if (task.status === "closed") {
        return [];
      }
      const links =
        await this.subject.modules.social.chatsToCrmModuleTasks.find(
          criteria({ crmModuleTaskId: task.id }),
        );
      if (links.length) {
        return [];
      }
      candidates = (await this.options(actorId, task.storeId)).participants;
    }
    if (!task.productId && !task.offerId) {
      return candidates;
    }
    const expert = await this.subject.customerWork.productAgent.resolve(task);
    const people = candidates.filter((item) => item.kind === "human");
    if (expert) {
      people.push({ ...expert, kind: "ai" });
    }
    return people;
  }

  private async assertThread(task: ITask, scope: ICrmWorkspaceThreadQuery) {
    const channel = await this.subject.customerWork.workspaceChannel(task);
    if (channel?.chatId !== scope.chatId) {
      throw new Error("Not Found error. The task conversation is unavailable");
    }
    if (channel.threadId === scope.threadId) {
      return channel;
    }
    const { social } = this.subject.modules;
    const link = await social.chatsToCrmModuleTasks.forThread(scope.threadId);
    if (link?.crmModuleTaskId === task.id && link.chatId === scope.chatId) {
      const thread = await social.thread.findById({ id: scope.threadId });
      if (thread) {
        return { ...link, title: thread.title };
      }
    }
    throw new Error("Not Found error. The task conversation is unavailable");
  }

  private async conversationTask(
    actorId: string,
    scope: ICrmWorkspaceThreadQuery,
  ) {
    const { canManageTasks } = await this.taskAccess(actorId, scope.storeId);
    const task = await this.subject.modules.crm.task.get(scope);
    await this.assertTaskAccess(task, actorId, canManageTasks);
    const channel = await this.assertThread(task, scope);
    return { task, channel };
  }

  private async taskOrderWork(task: ITask) {
    if (!task.orderId) {
      return null;
    }
    const work = await this.subject.modules.ecommerce.order.work.findByOrder(
      task.orderId,
    );
    if (
      work?.storeId !== task.storeId ||
      work.taskId !== task.id ||
      work.customerId !== task.customerId ||
      work.orderId !== task.orderId
    ) {
      return null;
    }
    return work;
  }

  private async conversationMessages(scope: ICrmWorkspaceThreadQuery) {
    const { social } = this.subject.modules;
    const links = await social.threadsToMessages.find(
      criteria({ threadId: scope.threadId }),
    );
    if (!links.length) {
      return [];
    }
    const chatMessages = await social.chatsToMessages.find({
      params: {
        filters: {
          and: [
            { column: "chatId", method: "eq", value: scope.chatId },
            {
              column: "messageId",
              method: "inArray",
              value: links.map(({ messageId }) => messageId),
            },
          ],
        },
      },
    });
    if (!chatMessages.length) {
      return [];
    }
    const messages = await social.message.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: chatMessages.map(({ messageId }) => messageId),
            },
          ],
        },
        orderBy: {
          and: [
            { column: "createdAt", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
    return new SocialMessages(this.subject).enrich(messages);
  }

  private async conversationActions(scope: ICrmWorkspaceThreadQuery) {
    const { social } = this.subject.modules;
    const links = await social.threadsToActions.find(
      criteria({ threadId: scope.threadId }),
    );
    if (!links.length) {
      return [];
    }
    const chatActions = await social.chatsToActions.find({
      params: {
        filters: {
          and: [
            { column: "chatId", method: "eq", value: scope.chatId },
            {
              column: "actionId",
              method: "inArray",
              value: links.map(({ actionId }) => actionId),
            },
          ],
        },
      },
    });
    if (!chatActions.length) {
      return [];
    }
    const actions = await social.action.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: chatActions.map(({ actionId }) => actionId),
            },
          ],
        },
      },
    });
    return new SocialActions(this.subject).enrich(actions);
  }

  async thread(
    actorId: string,
    scope: ICrmWorkspaceThreadQuery,
  ): Promise<ICrmWorkspaceConversation> {
    const { task, channel } = await this.conversationTask(actorId, scope);
    const [messages, actions, participants, work] = await Promise.all([
      this.conversationMessages(scope),
      this.conversationActions(scope),
      new SocialParticipants(this.subject).execute({
        socialModuleChatId: scope.chatId,
      }),
      this.taskOrderWork(task),
    ]);
    let visibleParticipants = participants;
    if (
      actorId !== task.customerId &&
      (await this.chatSettings.sharedCustomerThread(task, scope.chatId))
    ) {
      const customerAndAssignee = await this.chatSettings.protectedProfiles(
        task,
        scope.chatId,
      );
      const authors = new Set([
        ...customerAndAssignee,
        ...messages.flatMap(({ authorProfileIds }) => authorProfileIds ?? []),
      ]);
      visibleParticipants = participants.filter(({ id }) => authors.has(id));
    }
    let order: IOrderWorkView | null = null;
    if (work) {
      const artifact = (id: string) => {
        const params = new URLSearchParams({ ...scope, artifactId: id });
        return {
          id,
          path: `/api/rbac/subjects/${actorId}/crm-module/workspace/artifact?${params}`,
        };
      };
      order = {
        orderId: work.orderId,
        taskId: work.taskId,
        storeId: work.storeId,
        state: work.state,
        ...orderResultFiles(work, artifact),
        receipt: null,
        deliveryStatus:
          (work.paid && work.deliveredAt) || deliveredOrderWorkFile(work)
            ? "available"
            : "pending",
        trackingNumber: null,
      };
    }
    return {
      title: channel.title ?? "",
      canSend:
        task.status !== "closed" ||
        canDiscussCompletedOrder(task) ||
        (await this.taskAccess(actorId, task.storeId)).canManageTasks,
      messages,
      actions,
      participants: visibleParticipants.map((profile) => ({
        ...profile,
        metadata: {},
        allowedMcpServerIds: [],
      })),
      order,
    };
  }

  async send(
    actorId: string,
    scope: ICrmWorkspaceThreadQuery,
    message: ICrmWorkspaceThreadMessage,
  ) {
    const reply = await this.subject.repository.withSubjectLock(
      { subjectId: actorId },
      () =>
        this.subject.modules.crm.task.withTask(scope, async (task) => {
          const { canManageTasks } = await this.taskAccess(
            actorId,
            scope.storeId,
          );
          await this.assertTaskAccess(task, actorId, canManageTasks);
          await this.assertThread(task, scope);
          if (
            !canManageTasks &&
            task.status === "closed" &&
            !canDiscussCompletedOrder(task)
          ) {
            throw new Error("Permission error. Task chat access is required");
          }
          const profileId = await this.employees.ensureActorProfile(actorId);
          const saved = await this.subject.customerWork.postTaskMessage(task, {
            customerId: actorId,
            profileId,
            chatId: scope.chatId,
            threadId: scope.threadId,
            text: message.text,
            attachments: message.files,
            hasAttachments: Boolean(message.files?.length),
            sourceSystemId: message.operationKey,
          });
          return { message: saved, status: task.status };
        }),
    );
    if (reply.status !== "closed") {
      this.subject.customerWork.wakePendingWork(scope.taskId);
    }
    const [projected] = await new SocialMessages(this.subject).enrich([
      reply.message,
    ]);
    return projected;
  }

  async attachment(
    actorId: string,
    scope: ICrmWorkspaceThreadQuery,
    file: { messageId: string; attachmentId: string },
  ) {
    await this.conversationTask(actorId, scope);
    const [chatMessage] =
      await this.subject.modules.social.chatsToMessages.find(
        criteria({ chatId: scope.chatId, messageId: file.messageId }),
      );
    if (!chatMessage) {
      throw new Error("Not Found error. The message attachment is unavailable");
    }
    return this.subject.customerWork.threadAttachment({
      threadId: scope.threadId,
      ...file,
    });
  }

  async artifact(
    actorId: string,
    scope: ICrmWorkspaceThreadQuery,
    artifactId: string,
  ) {
    const { task } = await this.conversationTask(actorId, scope);
    const work = await this.taskOrderWork(task);
    return this.readOrderArtifact(work, artifactId);
  }

  async storeOrderArtifact(
    actorId: string,
    storeId: string,
    orderId: string,
    fileId: string,
  ) {
    await this.storeOrderAccess(actorId, storeId, orderId);
    const work =
      await this.subject.modules.ecommerce.order.work.findByOrder(orderId);
    return this.readOrderArtifact(
      work?.storeId === storeId ? work : null,
      fileId,
    );
  }

  private async readOrderArtifact(
    work: Awaited<ReturnType<Service["taskOrderWork"]>>,
    reference: string,
  ) {
    const preview = work?.files.find(
      (file) =>
        file.previewFileId === reference || file.legacyMessageId === reference,
    );
    const isDelivered =
      deliveredOrderWorkFile(work)?.originalFileId === reference;
    if (!preview && !isDelivered) {
      throw new Error("Not Found error. The order result file is unavailable");
    }
    const file =
      await this.subject.modules.fileStorage.file.privateContent.findById({
        id: preview?.previewFileId ?? reference,
      });
    if (!file) {
      throw new Error("Not Found error. The order result file is unavailable");
    }
    return file;
  }

  private async validateFunnelStages(
    actorId: string,
    funnel: Pick<IFunnel, "storeId" | "definition">,
    current: IFunnel | undefined,
    options: ICrmWorkspaceOptions,
    stageId?: string,
  ) {
    for (const stage of funnel.definition.stages) {
      if (stageId && stage.id !== stageId) {
        continue;
      }
      const existing = current?.definition.stages.find(
        ({ id }) => id === stage.id,
      );
      if (
        !stage.archived &&
        !stage.behavior &&
        !stage.defaultAssigneeSubjectId &&
        (!existing || existing.archived || existing.defaultAssigneeSubjectId)
      ) {
        throw new Error(
          "Validation error. Select a store employee for the stage",
        );
      }
      if (
        funnel.definition.progression === "linear" &&
        !funnel.definition.maintenanceSourceId &&
        !stage.archived &&
        (stage.behavior === "ecommerce-module-order-payment"
          ? Boolean(stage.workFunding)
          : !stage.behavior) &&
        (stage.workFunding || funnel.definition.workFunding) &&
        stage.workFunding?.payer !== "customer"
      ) {
        throw new Error(
          "Validation error. Configure the customer tariff for this stage",
        );
      }
      if (
        stage.behavior !== "order-file-delivery" &&
        needsStageWorkFunding(stage, existing) &&
        options.participants.some(
          ({ id, kind }) =>
            id === stage.defaultAssigneeSubjectId && kind === "ai",
        )
      ) {
        throw new Error("Validation error. Configure the stage work budget");
      }
      if (
        stage.defaultAssigneeSubjectId &&
        !options.participants.some(
          (person) => person.id === stage.defaultAssigneeSubjectId,
        )
      ) {
        throw new Error(
          "Validation error. The assignee must be linked to this store",
        );
      }
      if (
        stage.payerSubjectId &&
        !options.payers.some((person) => person.id === stage.payerSubjectId)
      ) {
        throw new Error("Validation error. The payer must be a store owner");
      }
      if (stage.workFunding) {
        const { payerSubjectId, currencyId } = stage.workFunding;
        if (
          stage.workFunding.payer !== "customer" &&
          !options.payers.some(({ id }) => id === payerSubjectId)
        ) {
          throw new Error(
            "Validation error. The stage payer must be a store owner",
          );
        }
        if (
          !options.currencies.some(
            ({ id, slug }) =>
              id === currencyId && slug?.toLowerCase() === "token",
          )
        ) {
          throw new Error(
            "Validation error. Choose the Token currency for stage work",
          );
        }
      }
      if (
        !stage.archived &&
        stage.provider &&
        stageWorkFunding(funnel.definition, stage)?.payer === "customer"
      ) {
        const agent = options.participants.find(
          ({ id, kind }) =>
            id === stage.defaultAssigneeSubjectId && kind === "ai",
        );
        if (agent) {
          const capability = stage.output === "image" ? "image" : "text";
          const funding = stageWorkFunding(funnel.definition, stage)!;
          const provider = this.subject.providerConnections;
          await provider.resolveWork(
            funnel.storeId,
            agent.id,
            capability,
            provider.workScope({ customerId: actorId }, stage, funding),
            stageWorkModelSelection(stage, capability),
          );
        }
      }
      if (!stage.archived && stage.skillIds?.length) {
        const skills =
          options.skillsByAssignee[stage.defaultAssigneeSubjectId ?? ""] ?? [];
        const ids = new Set(skills.map(({ id }) => id));
        if (stage.skillIds.some((id) => !ids.has(id))) {
          throw new Error(
            "Validation error. Stage skills must be linked to the assigned store agent",
          );
        }
      }
    }
    if (
      funnel.definition.workFunding &&
      !options.currencies.some(
        (currency) => currency.id === funnel.definition.workFunding?.currencyId,
      )
    ) {
      throw new Error("Validation error. Choose a configured work currency");
    }
  }

  private assertWorkspaceTask(task: ITask) {
    if (isStoreEmployeeTraining(task.openingKey)) {
      throw new Error("Not Found error. CRM task is unavailable");
    }
  }

  private async resumeAfterAssignment(
    previous: ITask,
    assigned: ITask,
    actorId: string,
  ) {
    if (assigned.assignmentRevision === previous.assignmentRevision) {
      return { task: assigned, resumed: false };
    }
    const resumed = await this.subject.customerWork.resumeAssignedReply(
      assigned,
      actorId,
    );
    return { task: resumed ?? assigned, resumed: Boolean(resumed) };
  }

  async execute(actorId: string, command: TCrmWorkspaceCommand) {
    const crm = this.subject.modules.crm;
    switch (command.kind) {
      case "create-employee": {
        const data = await this.employees.create(actorId, command.employee);
        return { kind: command.kind, data };
      }
      case "open-employee-chat": {
        const data = await this.employees.open(actorId, command.employee);
        return { kind: command.kind, data };
      }
      case "create-employee-thread": {
        const data = await this.employees.createThread(
          actorId,
          command.employee,
        );
        return { kind: command.kind, data };
      }
      case "join-task-chat":
      case "start-work":
      case "open-order-work": {
        const storeId =
          command.kind === "start-work"
            ? command.work.storeId
            : command.kind === "open-order-work"
              ? command.order.storeId
              : command.task.storeId;
        return this.subject.repository.withSubjectLock(
          { subjectId: actorId, savepoint: true },
          async () => {
            const { canManageTasks } = await this.taskAccess(actorId, storeId);
            if (command.kind === "join-task-chat") {
              const task = await this.subject.modules.crm.task.get(
                command.task,
              );
              await this.assertTaskAccess(task, actorId, canManageTasks);
              return {
                kind: command.kind,
                data: await this.attachTaskParticipants(actorId, task, []),
              };
            }
            const participantIds = command.participantIds ?? [];
            if (
              participantIds.some((id) => id !== actorId) &&
              !canManageTasks
            ) {
              throw new Error(
                "Permission error. Managing task participants requires a store manager",
              );
            }
            if (command.kind === "open-order-work") {
              const task = await this.subject.customerWork.openWorkspaceOrder({
                ...command.order,
                actorId,
                canManageTasks,
              });
              await this.assertTaskAccess(task, actorId, canManageTasks);
              await this.attachTaskParticipants(actorId, task, participantIds);
              return { kind: command.kind, data: { id: task.id } };
            }
            const { operation, ...scope } = command.work;
            const work = this.subject.customerWork;
            const result =
              operation === "ask"
                ? await work.execute(actorId, { ...scope, operation })
                : await work.execute(actorId, {
                    ...scope,
                    operation,
                    selection: { quantity: 1 },
                  });
            const task = await this.subject.modules.crm.task.get({
              storeId,
              taskId: result.taskId,
            });
            return {
              kind: command.kind,
              data: await this.attachTaskParticipants(
                actorId,
                task,
                participantIds,
              ),
            };
          },
        );
      }
      case "fulfill": {
        const data = await this.subject.orderWork.fulfill(
          actorId,
          command.fulfillment,
        );
        return { kind: command.kind, data };
      }
      case "save-funnel-stage": {
        const { storeId, stage } = command.funnel;
        const options = await this.options(actorId, storeId, false);
        const saved = await crm.funnel.edit(command, actorId, {
          validateStage: (definition, previous) =>
            this.validateFunnelStages(
              actorId,
              { storeId, definition },
              previous,
              options,
              stage.id,
            ),
        });
        const data = await this.withLinkedProducts(saved);
        return { kind: command.kind, data };
      }
      case "save-funnel-settings":
      case "move-funnel-stage":
      case "delete-funnel-stage": {
        const { storeId } = command.funnel;
        await this.access(actorId, storeId);
        const saved = await crm.funnel.edit(command, actorId, {
          onMigrated: async (taskId, stage) => {
            const task = await crm.task.get({ storeId, taskId });
            const assigned = stage.defaultAssigneeSubjectId
              ? await this.subject.customerWork.assignStageEmployee(
                  task,
                  stage,
                  undefined,
                  "migration",
                )
              : task;
            await this.subject.customerWork.queueStageEntry(assigned);
          },
        });
        const data = await this.withLinkedProducts(saved);
        return { kind: command.kind, data };
      }
      case "save": {
        const funnel = command.funnel;
        const options = await this.options(actorId, funnel.storeId, false);
        const current = funnel.funnelId
          ? await crm.funnel.get(
              funnel.storeId,
              funnel.funnelId,
              funnel.linkedProductIds !== undefined,
            )
          : undefined;
        await this.validateFunnelStages(
          actorId,
          {
            storeId: funnel.storeId,
            definition: funnelDefinitionSchema.parse(funnel.definition),
          },
          current,
          options,
        );
        const { productIds, linkedProductIds, ...fields } = funnel;
        let bindings: Partial<IFunnelBindings> = {
          ...current?.bindings,
          productIds: productIds ?? current?.bindings.productIds ?? [],
        };
        if (linkedProductIds !== undefined) {
          bindings = await crm.funnel.selectProducts(
            funnel.storeId,
            current?.bindings,
            linkedProductIds,
          );
        }
        const saved = await crm.funnel.save({
          ...fields,
          bindings,
        });
        const data = await this.withLinkedProducts(saved);
        return { kind: command.kind, data };
      }
      case "transition": {
        const { reason, evidence, ...input } = command.transition;
        await this.access(actorId, input.storeId);
        const work = this.subject.customerWork;
        const { task, resumed } = await crm.task.withTask(
          input,
          async (current) => {
            this.assertWorkspaceTask(current);
            const funnel = await crm.task.getFunnel(input);
            if (current.revision === input.expectedRevision) {
              if (
                current.expectedEvent &&
                current.expectedEvent !== "message"
              ) {
                throw new Error(
                  "Forbidden error. This stage requires evidence from the owning domain",
                );
              }
              const stage = funnel.definition.stages.find(
                (candidate) => candidate.id === current.stageId,
              );
              if (stage?.evidenceInstruction && !evidence) {
                throw new Error("Validation error. Stage evidence is required");
              }
            }
            const transitioned = await crm.task.transition({
              ...input,
              actorId,
              actorKind: "manager",
              evidence: {
                kind: "manual",
                reason: [reason, evidence].filter(Boolean).join("\n"),
              },
            });
            if (transitioned.stageId === current.stageId) {
              return { task: transitioned, resumed: false };
            }
            const nextStage = funnel.definition.stages.find(
              ({ id }) => id === transitioned.stageId,
            );
            let assigned = transitioned;
            if (nextStage) {
              assigned = await work.assignStageEmployee(
                transitioned,
                nextStage,
              );
              if (assigned.orderId) {
                const queued = await work.queueStageEntry(assigned);
                return { task: queued ?? assigned, resumed: Boolean(queued) };
              }
            }
            return this.resumeAfterAssignment(transitioned, assigned, actorId);
          },
        );
        if (resumed) {
          work.wakePendingWork(task.id);
        }
        const [data] = await this.taskRows([task]);
        return { kind: command.kind, data };
      }
      case "assign": {
        const assignment = command.assignment;
        await this.access(actorId, assignment.storeId);
        const work = this.subject.customerWork;
        const { task, resumed } = await crm.task.withTask(
          assignment,
          async (current) => {
            await this.access(actorId, current.storeId);
            this.assertWorkspaceTask(current);
            if (current.status === "closed") {
              throw new Error("Conflict error. The task is closed");
            }
            const channel = await work.workspaceChannel(current);
            const candidates = await this.assignmentCandidates(
              actorId,
              current,
              channel,
            );
            const participant = candidates.find(
              (person) => person.id === assignment.assigneeId,
            );
            if (!participant) {
              throw new Error(
                "Permission error. The assignee must be available for this task",
              );
            }
            const assigneeKind = participant.kind;
            const funnel = await crm.task.getFunnel({
              storeId: current.storeId,
              taskId: current.id,
            });
            const stage = funnel.definition.stages.find(
              ({ id }) => id === current.stageId,
            );
            const resumeStage =
              current.assigneeKind === "human" &&
              current.assigneeId !== assignment.assigneeId &&
              stage?.defaultAssigneeSubjectId === assignment.assigneeId;
            const assigned = await crm.task.assign(
              {
                ...assignment,
                actorId,
                assigneeKind,
              },
              "manager",
              resumeStage ? "stage" : undefined,
            );
            if (channel && participant.profileId && assigneeKind === "human") {
              await new AssignmentCandidates(this.subject).attach(
                channel.chatId,
                participant.profileId,
              );
            }
            await work.ensureAssignedAgentInThread(assigned);
            return this.resumeAfterAssignment(current, assigned, actorId);
          },
        );
        if (resumed) {
          work.wakePendingWork(task.id);
        }
        const [data] = await this.taskRows([task]);
        return { kind: command.kind, data };
      }
    }
  }
}
