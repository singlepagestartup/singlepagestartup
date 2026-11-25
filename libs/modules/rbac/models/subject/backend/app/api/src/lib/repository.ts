import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import {
  DatabaseRepository,
  consistencyContext,
  trackRepositoryRead,
  withConsistencyTransaction,
} from "@sps/shared-backend-api";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Table as SubjectOrder } from "@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database";
import { Table as SubjectTask } from "@sps/rbac/relations/subjects-to-crm-module-tasks/backend/repository/database";
import { Table as CrmTask } from "@sps/crm/models/task/backend/repository/database";
import { STORE_EMPLOYEE_TRAINING_KEY_PREFIX } from "@sps/crm/models/task/sdk/model";
import { Table as Funnel } from "@sps/crm/models/funnel/backend/repository/database";
import { Table as FunnelTask } from "@sps/crm/relations/funnels-to-tasks/backend/repository/database";
import { Table as StoreGrant } from "@sps/rbac/relations/subjects-to-ecommerce-module-stores/backend/repository/database";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as SubjectProfile } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/repository/database";
import { Table as Message } from "@sps/social/models/message/backend/repository/database";
import { Table as ProfileChat } from "@sps/social/relations/profiles-to-chats/backend/repository/database";
import { Table as ChatTask } from "@sps/social/relations/chats-to-crm-module-tasks/backend/repository/database";
import { Table as ChatThread } from "@sps/social/relations/chats-to-threads/backend/repository/database";
import { Table as ChatMessage } from "@sps/social/relations/chats-to-messages/backend/repository/database";
import { Table as ThreadMessage } from "@sps/social/relations/threads-to-messages/backend/repository/database";
import { Table as ProfileMessage } from "@sps/social/relations/profiles-to-messages/backend/repository/database";
import { Table as MessageFile } from "@sps/social/relations/messages-to-file-storage-module-files/backend/repository/database";
import { Table as EcommerceProduct } from "@sps/ecommerce/models/product/backend/repository/database";
import { Table as Category } from "@sps/ecommerce/models/category/backend/repository/database";
import { Table as Attribute } from "@sps/ecommerce/models/attribute/backend/repository/database";
import { Table as AttributeKey } from "@sps/ecommerce/models/attribute-key/backend/repository/database";
import { Table as KeyAttribute } from "@sps/ecommerce/relations/attribute-keys-to-attributes/backend/repository/database";
import { Table as AttributeCurrency } from "@sps/ecommerce/relations/attributes-to-billing-module-currencies/backend/repository/database";
import { Table as StoreAttribute } from "@sps/ecommerce/relations/stores-to-attributes/backend/repository/database";
import { Table as ProductAttribute } from "@sps/ecommerce/relations/products-to-attributes/backend/repository/database";
import { Table as OfferAttribute } from "@sps/ecommerce/relations/stores-to-products-to-attributes/backend/repository/database";
import {
  reservedCatalogKeySlugs,
  sensitiveCatalogKeySlugPattern,
  type IStoreCatalogDirectoryItem,
  type TStoreCatalogDirectoryKind,
} from "@sps/rbac/models/subject/sdk/model/src/lib/store-catalog-directories";
import { Table as EcommerceOrder } from "@sps/ecommerce/models/order/backend/repository/database";
import { Table as EcommerceOffer } from "@sps/ecommerce/relations/stores-to-products/backend/repository/database";
import { Table as EcommerceOrderLine } from "@sps/ecommerce/relations/orders-to-products/backend/repository/database";
import { Table as EcommerceStoreOrder } from "@sps/ecommerce/relations/stores-to-orders/backend/repository/database";
import { Table as CrmTaskOffer } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/backend/repository/database";
import { Table as CrmTaskOrder } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/backend/repository/database";
import { storeProductOfferVariants } from "@sps/rbac/models/subject/sdk/model/src/lib/ecommerce-catalog";
import { CRM_WORKSPACE_STAFF_MESSAGE_PREFIX } from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  inArray,
  isNull,
  like,
  ne,
  notExists,
  notLike,
  notInArray,
  type SQL,
  type SQLWrapper,
  or,
  sql,
  sum,
} from "drizzle-orm";

interface IStoreCatalogPage {
  storeId: string;
  offerVariants: string[];
  limit: number;
  offset: number;
  search?: string;
}

interface ISocialActivityScope {
  subjectId: string;
  chatIds: string[];
  threadIds?: string[];
}

interface ISocialReadScope {
  subjectId: string;
  chatId: string;
  threadId: string;
  messageId: string;
}

@injectable()
@injectFromBase()
export class Repository extends DatabaseRepository<typeof Table> {
  async workspaceStaffTaskIds(subjectId: string) {
    const subjectFilter = {
      and: [{ column: "subjectId", method: "eq" as const, value: subjectId }],
    };
    await Promise.all([
      trackRepositoryRead(SubjectTask, this.db, subjectFilter),
      trackRepositoryRead(SubjectProfile, this.db, subjectFilter),
      trackRepositoryRead(ProfileChat, this.db),
      trackRepositoryRead(ChatTask, this.db),
      trackRepositoryRead(CrmTask, this.db),
    ]);
    const assigned = this.db
      .select({ id: SubjectTask.crmModuleTaskId })
      .from(SubjectTask)
      .innerJoin(CrmTask, eq(CrmTask.id, SubjectTask.crmModuleTaskId))
      .where(
        and(
          eq(SubjectTask.subjectId, subjectId),
          eq(SubjectTask.variant, "assignee"),
          eq(CrmTask.assigneeKind, "human"),
        ),
      );
    const invited = this.db
      .select({ id: ChatTask.crmModuleTaskId })
      .from(SubjectProfile)
      .innerJoin(
        ProfileChat,
        eq(ProfileChat.profileId, SubjectProfile.socialModuleProfileId),
      )
      .innerJoin(ChatTask, eq(ChatTask.chatId, ProfileChat.chatId))
      .where(
        and(
          eq(SubjectProfile.subjectId, subjectId),
          eq(SubjectProfile.variant, "default"),
          eq(ProfileChat.variant, "participant"),
        ),
      );
    const rows = await assigned.union(invited);
    return new Set(rows.map(({ id }) => id));
  }

  async workspaceStaffAuthors(scope: {
    taskId: string;
    chatId: string;
    threadId: string;
  }) {
    const { taskId, chatId, threadId } = scope;
    const variant = "customer-work";
    await trackRepositoryRead(ThreadMessage, this.db, {
      and: [{ column: "threadId", method: "eq", value: threadId }],
    });
    await trackRepositoryRead(ChatMessage, this.db, {
      and: [{ column: "chatId", method: "eq", value: chatId }],
    });
    await trackRepositoryRead(Message, this.db, {
      and: [{ column: "variant", method: "eq", value: variant }],
    });
    await trackRepositoryRead(ProfileMessage, this.db);
    const authors = await this.db
      .selectDistinct({
        sourceSystemId: Message.sourceSystemId,
        staffSubjectId: sql<
          string | null
        >`${Message.metadata}->>'customerWorkStaffSubjectId'`,
        profileId: ProfileMessage.profileId,
      })
      .from(ThreadMessage)
      .innerJoin(Message, eq(Message.id, ThreadMessage.messageId))
      .innerJoin(
        ChatMessage,
        and(
          eq(ChatMessage.messageId, Message.id),
          eq(ChatMessage.chatId, chatId),
        ),
      )
      .innerJoin(ProfileMessage, eq(ProfileMessage.messageId, Message.id))
      .where(
        and(
          eq(ThreadMessage.threadId, threadId),
          eq(Message.variant, variant),
          or(
            sql`${Message.metadata}->>'customerWorkStaffSubjectId' is not null`,
            like(
              Message.sourceSystemId,
              `${CRM_WORKSPACE_STAFF_MESSAGE_PREFIX}${taskId}:%`,
            ),
          ),
        ),
      );
    return authors;
  }

  async storeProductCounts(storeIds: string[], costVisibleStoreIds: string[]) {
    await trackRepositoryRead(EcommerceOffer, this.db, {
      and: [{ column: "storeId", method: "inArray", value: storeIds }],
    });
    await trackRepositoryRead(EcommerceProduct, this.db);
    return this.db
      .select({
        storeId: EcommerceOffer.storeId,
        count: countDistinct(EcommerceProduct.id),
      })
      .from(EcommerceOffer)
      .innerJoin(
        EcommerceProduct,
        eq(EcommerceProduct.id, EcommerceOffer.productId),
      )
      .where(
        and(
          inArray(EcommerceOffer.storeId, storeIds),
          or(
            inArray(EcommerceOffer.variant, storeProductOfferVariants(false)),
            and(
              inArray(EcommerceOffer.storeId, costVisibleStoreIds),
              inArray(EcommerceOffer.variant, storeProductOfferVariants(true)),
            ),
          ),
        ),
      )
      .groupBy(EcommerceOffer.storeId);
  }

  private async visibleStoreEmployees(
    storeIds: string[],
    employeeVariants: string[],
  ) {
    await trackRepositoryRead(StoreGrant, this.db, {
      and: [
        {
          column: "ecommerceModuleStoreId",
          method: "inArray",
          value: storeIds,
        },
      ],
    });
    await trackRepositoryRead(StoreGrant, this.db, {
      and: [{ column: "variant", method: "eq", value: "assistant" }],
    });
    await trackRepositoryRead(Table, this.db);
    await trackRepositoryRead(SubjectProfile, this.db);
    await trackRepositoryRead(Profile, this.db);

    const staff = this.db
      .select({
        storeId: StoreGrant.ecommerceModuleStoreId,
        subjectId: StoreGrant.subjectId,
        agent: sql<boolean>`bool_or(${StoreGrant.variant} = 'crm-agent')`.as(
          "agent",
        ),
      })
      .from(StoreGrant)
      .where(
        and(
          inArray(StoreGrant.ecommerceModuleStoreId, storeIds),
          inArray(StoreGrant.variant, employeeVariants),
        ),
      )
      .groupBy(StoreGrant.ecommerceModuleStoreId, StoreGrant.subjectId)
      .as("staff");

    const assistant = this.db
      .select({ id: StoreGrant.id })
      .from(StoreGrant)
      .where(
        and(
          eq(StoreGrant.subjectId, Table.id),
          eq(StoreGrant.variant, "assistant"),
        ),
      );
    const profile = this.db
      .select({
        title: Profile.title,
        subtitle: Profile.subtitle,
        slug: Profile.slug,
        variant: Profile.variant,
        adminTitle: Profile.adminTitle,
        matches: sql<number>`count(*) over ()`.as("matches"),
      })
      .from(SubjectProfile)
      .innerJoin(Profile, eq(Profile.id, SubjectProfile.socialModuleProfileId))
      .where(
        and(
          eq(SubjectProfile.subjectId, Table.id),
          eq(SubjectProfile.variant, "default"),
          sql`(${Profile.variant} = 'artificial-intelligence') = ${staff.agent}`,
        ),
      )
      .orderBy(SubjectProfile.createdAt, SubjectProfile.id)
      .limit(1)
      .as("employee_profile");

    const name = sql<string>`coalesce(nullif(${profile.title}->>'ru', ''), nullif(${profile.title}->>'en', ''), nullif(${profile.adminTitle}, ''), ${Table.slug})`;
    return this.db
      .select({
        storeId: staff.storeId,
        id: Table.id,
        agent: staff.agent,
        name: name.as("employee_name"),
        subjectSlug: sql<string>`${Table.slug}`.as("subject_slug"),
        profileTitle: profile.title,
        profileSubtitle: profile.subtitle,
        profileSlug: profile.slug,
        profileVariant: profile.variant,
      })
      .from(staff)
      .innerJoin(Table, eq(Table.id, staff.subjectId))
      .leftJoinLateral(
        profile,
        or(eq(staff.agent, false), eq(profile.matches, 1)),
      )
      .where(
        or(
          and(
            eq(staff.agent, true),
            eq(Table.variant, "agent"),
            notExists(assistant),
          ),
          and(
            eq(staff.agent, false),
            ne(Table.variant, "agent"),
            sql`${name} <> ''`,
          ),
        ),
      )
      .as("visible_staff");
  }

  async storeEmployeeCounts(storeIds: string[], employeeVariants: string[]) {
    const staff = await this.visibleStoreEmployees(storeIds, employeeVariants);
    return this.db
      .select({ storeId: staff.storeId, count: count() })
      .from(staff)
      .groupBy(staff.storeId);
  }

  async storeEmployees(input: {
    storeId: string;
    employeeVariants: string[];
    offset: number;
    limit: number;
    search?: string;
  }) {
    const staff = await this.visibleStoreEmployees(
      [input.storeId],
      input.employeeVariants,
    );
    const search = input.search?.trim();
    const matches = search
      ? or(
          sql`strpos(lower(${staff.name}), lower(${search})) > 0`,
          sql`strpos(lower(${staff.subjectSlug}), lower(${search})) > 0`,
          sql`strpos(lower(${staff.profileSlug}), lower(${search})) > 0`,
          sql`exists (select 1 from jsonb_each_text(${staff.profileTitle}) as title where strpos(lower(title.value), lower(${search})) > 0)`,
        )
      : undefined;
    const [rows, [summary]] = await Promise.all([
      this.db
        .select()
        .from(staff)
        .where(matches)
        .orderBy(staff.id)
        .limit(input.limit)
        .offset(input.offset),
      this.db.select({ total: count() }).from(staff).where(matches),
    ]);
    const items = rows.map(
      ({
        id,
        name,
        agent,
        profileVariant,
        profileTitle,
        profileSubtitle,
        profileSlug,
      }) => ({
        id,
        name,
        kind: agent ? ("ai" as const) : ("human" as const),
        ...(profileVariant !== null &&
          profileSlug !== null && {
            profile: {
              variant: profileVariant,
              title: profileTitle,
              subtitle: profileSubtitle,
              slug: profileSlug,
            },
          }),
      }),
    );
    const nextOffset = input.offset + items.length;
    return {
      items,
      total: summary.total,
      nextOffset: nextOffset < summary.total ? nextOffset : undefined,
    };
  }

  async lockCatalogDirectoryVersion(
    kind: TStoreCatalogDirectoryKind,
    id: string,
  ) {
    const table = {
      categories: Category,
      "attribute-keys": AttributeKey,
      attributes: Attribute,
    }[kind];
    const [record] = await this.db
      .select({ updatedAt: table.updatedAt })
      .from(table)
      .where(eq(table.id, id))
      .for("update");
    return record?.updatedAt.toISOString();
  }

  private catalogKeyFilter() {
    return and(
      eq(AttributeKey.variant, "default"),
      eq(AttributeKey.type, "feature"),
      inArray(AttributeKey.field, ["string", "number"]),
      notInArray(AttributeKey.slug, reservedCatalogKeySlugs),
      sql`${AttributeKey.slug} !~* ${sensitiveCatalogKeySlugPattern.source}`,
    );
  }

  private catalogSearch(
    search: string | undefined,
    text: SQLWrapper[],
    localized: SQLWrapper[],
  ) {
    if (!search) {
      return undefined;
    }
    return or(
      ...text.map(
        (field) => sql`strpos(lower(${field}), lower(${search})) > 0`,
      ),
      ...localized.map(
        (field) => sql`exists (
        select 1 from jsonb_each_text(${field}) as translation
        where strpos(lower(translation.value), lower(${search})) > 0
      )`,
      ),
    );
  }

  async storeCatalogDirectory(input: {
    kind: TStoreCatalogDirectoryKind;
    storeId: string;
    canReadCosts: boolean;
    offset: number;
    limit: number;
    search?: string;
    ids?: string[];
  }): Promise<{ items: IStoreCatalogDirectoryItem[]; total: number }> {
    const { kind, storeId, ids, search, offset, limit } = input;
    if (ids && !ids.length) {
      return { items: [], total: 0 };
    }
    if (kind !== "attributes") {
      const table = kind === "categories" ? Category : AttributeKey;
      await trackRepositoryRead(table, this.db);
      const visible = and(
        kind === "categories"
          ? eq(Category.variant, "default")
          : this.catalogKeyFilter(),
        ids ? inArray(table.id, ids) : undefined,
        this.catalogSearch(
          search,
          [table.slug, table.adminTitle],
          [table.title],
        ),
      );
      const [items, [row]] = await Promise.all([
        this.db
          .select({
            id: table.id,
            slug: table.slug,
            adminTitle: table.adminTitle,
            title: table.title,
            ...(kind === "attribute-keys" && { field: AttributeKey.field }),
          })
          .from(table)
          .where(visible)
          .orderBy(table.adminTitle, table.id)
          .limit(limit)
          .offset(offset),
        this.db.select({ total: count() }).from(table).where(visible),
      ]);
      return { items, total: row.total };
    }

    for (const table of [
      Attribute,
      AttributeKey,
      KeyAttribute,
      StoreAttribute,
      ProductAttribute,
      OfferAttribute,
      AttributeCurrency,
      EcommerceOffer,
    ]) {
      await trackRepositoryRead(table, this.db);
    }
    const visibleOffer = and(
      eq(EcommerceOffer.storeId, storeId),
      inArray(
        EcommerceOffer.variant,
        storeProductOfferVariants(input.canReadCosts),
      ),
    );
    const inStore = this.db
      .select({ id: StoreAttribute.id })
      .from(StoreAttribute)
      .where(
        and(
          eq(StoreAttribute.attributeId, Attribute.id),
          eq(StoreAttribute.storeId, storeId),
        ),
      );
    const inProduct = this.db
      .select({ id: ProductAttribute.id })
      .from(ProductAttribute)
      .innerJoin(
        EcommerceOffer,
        eq(EcommerceOffer.productId, ProductAttribute.productId),
      )
      .where(and(eq(ProductAttribute.attributeId, Attribute.id), visibleOffer));
    const inOffer = this.db
      .select({ id: OfferAttribute.id })
      .from(OfferAttribute)
      .innerJoin(
        EcommerceOffer,
        eq(EcommerceOffer.id, OfferAttribute.storesToProductsId),
      )
      .where(and(eq(OfferAttribute.attributeId, Attribute.id), visibleOffer));
    const keyCount = this.db
      .select({ total: count() })
      .from(KeyAttribute)
      .where(eq(KeyAttribute.attributeId, Attribute.id));
    const currency = this.db
      .select({ id: AttributeCurrency.id })
      .from(AttributeCurrency)
      .where(eq(AttributeCurrency.attributeId, Attribute.id));
    const visible = and(
      eq(Attribute.variant, "default"),
      this.catalogKeyFilter(),
      sql`(${keyCount}) = 1`,
      notExists(currency),
      or(exists(inStore), exists(inProduct), exists(inOffer)),
      ids ? inArray(Attribute.id, ids) : undefined,
      this.catalogSearch(
        search,
        [
          Attribute.slug,
          Attribute.adminTitle,
          AttributeKey.slug,
          AttributeKey.adminTitle,
          sql`case when ${AttributeKey.field} = 'number' then ${Attribute.number}::text end`,
        ],
        [
          sql`case when ${AttributeKey.field} = 'string' then ${Attribute.string} end`,
          AttributeKey.title,
        ],
      ),
    );
    const entries = this.db
      .select({
        id: Attribute.id,
        slug: Attribute.slug,
        adminTitle: Attribute.adminTitle,
        number: Attribute.number,
        text: Attribute.string,
        field: AttributeKey.field,
        keyId: sql<string>`${AttributeKey.id}`.as("key_id"),
        keyAdminTitle: sql<string>`${AttributeKey.adminTitle}`.as(
          "key_admin_title",
        ),
        keyTranslations: AttributeKey.title,
      })
      .from(Attribute)
      .innerJoin(KeyAttribute, eq(KeyAttribute.attributeId, Attribute.id))
      .innerJoin(AttributeKey, eq(AttributeKey.id, KeyAttribute.attributeKeyId))
      .where(visible)
      .as("directory_attributes");
    const [rows, [row]] = await Promise.all([
      this.db
        .select()
        .from(entries)
        .orderBy(entries.adminTitle, entries.id)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(entries),
    ]);
    const items = rows.map(
      ({ number, text, keyAdminTitle, keyTranslations, ...entry }) => ({
        ...entry,
        keyTitle: keyAdminTitle,
        keyTranslations,
        value: entry.field === "number" ? number : text,
      }),
    );
    return { items, total: row.total };
  }

  storeCatalogProducts(input: IStoreCatalogPage) {
    return this.storeProductPage(input, false, (visible) =>
      this.db
        .select()
        .from(EcommerceProduct)
        .where(visible)
        .orderBy(EcommerceProduct.id)
        .limit(input.limit)
        .offset(input.offset),
    );
  }

  storeFunnelProducts(input: Omit<IStoreCatalogPage, "offerVariants">) {
    return this.storeProductPage(
      { ...input, offerVariants: ["default", "hidden"] },
      true,
      (visible) =>
        this.db
          .select({
            id: EcommerceProduct.id,
            title: EcommerceProduct.title,
            adminTitle: EcommerceProduct.adminTitle,
          })
          .from(EcommerceProduct)
          .where(visible)
          .orderBy(EcommerceProduct.id)
          .limit(input.limit)
          .offset(input.offset),
    );
  }

  private async storeProductPage<TItem>(
    input: IStoreCatalogPage,
    forFunnel: boolean,
    readPage: (visible: SQL | undefined) => PromiseLike<TItem[]>,
  ) {
    const { storeId, offerVariants, search } = input;
    await trackRepositoryRead(EcommerceOffer, this.db, {
      and: [{ column: "storeId", method: "eq", value: storeId }],
    });
    await trackRepositoryRead(EcommerceProduct, this.db);

    const belongsToStore = this.db
      .select({ id: EcommerceOffer.id })
      .from(EcommerceOffer)
      .where(
        and(
          eq(EcommerceOffer.productId, EcommerceProduct.id),
          eq(EcommerceOffer.storeId, storeId),
          inArray(EcommerceOffer.variant, offerVariants),
          forFunnel
            ? sql`coalesce(${EcommerceOffer.settings}->'initialGrant', 'false'::jsonb) <> 'true'::jsonb`
            : undefined,
        ),
      );
    const matches = search
      ? or(
          forFunnel
            ? undefined
            : sql`strpos(lower(${EcommerceProduct.slug}), lower(${search})) > 0`,
          sql`strpos(lower(${EcommerceProduct.adminTitle}), lower(${search})) > 0`,
          sql`exists (
            select 1 from jsonb_each_text(${EcommerceProduct.title}) as title
            where strpos(lower(title.value), lower(${search})) > 0
          )`,
        )
      : undefined;
    const visible = and(
      exists(belongsToStore),
      matches,
      forFunnel ? eq(EcommerceProduct.variant, "default") : undefined,
    );
    const [items, [row]] = await Promise.all([
      readPage(visible),
      this.db.select({ total: count() }).from(EcommerceProduct).where(visible),
    ]);
    return { items, total: row.total };
  }

  private placedOrderInStore(storeId: string, productId?: string) {
    const storeOrder = this.db
      .select({ id: EcommerceStoreOrder.id })
      .from(EcommerceStoreOrder)
      .where(
        and(
          eq(EcommerceStoreOrder.storeId, storeId),
          eq(EcommerceStoreOrder.orderId, EcommerceOrder.id),
        ),
      );
    const storeWork = this.db
      .select({ id: CrmTaskOrder.taskId })
      .from(CrmTaskOrder)
      .innerJoin(CrmTaskOffer, eq(CrmTaskOffer.taskId, CrmTaskOrder.taskId))
      .innerJoin(EcommerceOffer, eq(EcommerceOffer.id, CrmTaskOffer.offerId))
      .where(
        and(
          eq(EcommerceOffer.storeId, storeId),
          productId ? eq(EcommerceOffer.productId, productId) : undefined,
          eq(CrmTaskOrder.orderId, EcommerceOrder.id),
        ),
      );

    return and(
      exists(storeOrder),
      or(
        ne(EcommerceOrder.type, "cart"),
        ne(EcommerceOrder.status, "new"),
        exists(storeWork),
      ),
    );
  }

  private async trackStoreOrders(storeId: string) {
    const byStore = {
      and: [{ column: "storeId", method: "eq" as const, value: storeId }],
    };
    await trackRepositoryRead(EcommerceStoreOrder, this.db, byStore);
    await trackRepositoryRead(EcommerceOrder, this.db);
    await trackRepositoryRead(CrmTaskOrder, this.db);
    await trackRepositoryRead(CrmTaskOffer, this.db);
    await trackRepositoryRead(EcommerceOffer, this.db, byStore);
  }

  private async customerTasks(storeId: string) {
    await Promise.all([
      trackRepositoryRead(SubjectTask, this.db),
      trackRepositoryRead(CrmTask, this.db),
      trackRepositoryRead(FunnelTask, this.db),
      trackRepositoryRead(Funnel, this.db, {
        and: [{ column: "storeId", method: "eq", value: storeId }],
      }),
    ]);
    return this.db
      .select({ subjectId: SubjectTask.subjectId, taskId: CrmTask.id })
      .from(SubjectTask)
      .innerJoin(CrmTask, eq(CrmTask.id, SubjectTask.crmModuleTaskId))
      .innerJoin(FunnelTask, eq(FunnelTask.taskId, CrmTask.id))
      .innerJoin(Funnel, eq(Funnel.id, FunnelTask.funnelId))
      .where(
        and(
          eq(SubjectTask.variant, "customer"),
          eq(FunnelTask.variant, "primary"),
          eq(Funnel.storeId, storeId),
          notLike(CrmTask.openingKey, `${STORE_EMPLOYEE_TRAINING_KEY_PREFIX}%`),
        ),
      )
      .as("customer_tasks");
  }

  private async customerOrders(
    storeId: string,
    tasks: Awaited<ReturnType<Repository["customerTasks"]>>,
  ) {
    await trackRepositoryRead(SubjectOrder, this.db);
    const owners = this.db
      .select({ subjectId: SubjectOrder.subjectId, orderId: EcommerceOrder.id })
      .from(SubjectOrder)
      .innerJoin(
        EcommerceOrder,
        eq(EcommerceOrder.id, SubjectOrder.ecommerceModuleOrderId),
      )
      .where(this.placedOrderInStore(storeId));
    const hasOwner = this.db
      .select({ id: SubjectOrder.id })
      .from(SubjectOrder)
      .where(eq(SubjectOrder.ecommerceModuleOrderId, EcommerceOrder.id));
    const taskBuyers = this.db
      .select({ subjectId: tasks.subjectId, orderId: EcommerceOrder.id })
      .from(tasks)
      .innerJoin(CrmTaskOrder, eq(CrmTaskOrder.taskId, tasks.taskId))
      .innerJoin(EcommerceOrder, eq(EcommerceOrder.id, CrmTaskOrder.orderId))
      .where(and(this.placedOrderInStore(storeId), notExists(hasOwner)));
    return owners.union(taskBuyers).as("customer_orders");
  }

  async storeCustomers(input: {
    storeId: string;
    customerId?: string;
    search?: string;
    offset: number;
    limit: number;
  }) {
    const { storeId, customerId, search, offset, limit } = input;
    await Promise.all([
      this.trackStoreOrders(storeId),
      trackRepositoryRead(Table, this.db),
      trackRepositoryRead(SubjectProfile, this.db),
      trackRepositoryRead(Profile, this.db),
    ]);
    const tasks = await this.customerTasks(storeId);
    const orders = await this.customerOrders(storeId, tasks);
    const ids = this.db
      .select({ id: tasks.subjectId })
      .from(tasks)
      .union(this.db.select({ id: orders.subjectId }).from(orders))
      .as("buyers");
    const profile = this.db
      .select({
        title: Profile.title,
        subtitle: Profile.subtitle,
        slug: Profile.slug,
      })
      .from(SubjectProfile)
      .innerJoin(Profile, eq(Profile.id, SubjectProfile.socialModuleProfileId))
      .where(
        and(
          eq(SubjectProfile.subjectId, Table.id),
          inArray(SubjectProfile.variant, ["default", "telegram"]),
        ),
      )
      .orderBy(
        sql`case when ${SubjectProfile.variant} = 'default' then 0 else 1 end`,
        SubjectProfile.createdAt,
        SubjectProfile.id,
      )
      .limit(1)
      .as("buyer_profile");
    const matches = search
      ? or(
          sql`strpos(lower(${Table.slug}),lower(${search})) > 0`,
          sql`strpos(lower(${profile.slug}),lower(${search})) > 0`,
          sql`exists (select 1 from jsonb_each_text(${profile.title}) as t where strpos(lower(t.value),lower(${search})) > 0)`,
        )
      : undefined;
    const buyers = this.db
      .select({
        subjectId: Table.id,
        subjectSlug: sql<string>`${Table.slug}`.as("subject_slug"),
        profileSlug: profile.slug,
        title: profile.title,
        subtitle: profile.subtitle,
      })
      .from(ids)
      .innerJoin(Table, eq(Table.id, ids.id))
      .leftJoinLateral(profile, sql`true`)
      .where(and(customerId ? eq(Table.id, customerId) : undefined, matches))
      .as("store_buyers");
    const orderCounts = this.db
      .select({ subjectId: orders.subjectId, qty: count().as("qty") })
      .from(orders)
      .groupBy(orders.subjectId)
      .as("order_counts");
    const [items, [summary]] = await Promise.all([
      this.db
        .select({
          subjectId: buyers.subjectId,
          subjectSlug: buyers.subjectSlug,
          profileSlug: buyers.profileSlug,
          title: buyers.title,
          subtitle: buyers.subtitle,
          orderCount: sql<number>`coalesce(${orderCounts.qty},0)`.mapWith(
            Number,
          ),
        })
        .from(buyers)
        .leftJoin(orderCounts, eq(orderCounts.subjectId, buyers.subjectId))
        .orderBy(buyers.subjectSlug, buyers.subjectId)
        .offset(offset)
        .limit(limit),
      this.db.select({ total: count() }).from(buyers),
    ]);
    return { items, total: summary.total };
  }

  async storeOrderCount(storeId: string) {
    await this.trackStoreOrders(storeId);
    const [row] = await this.db
      .select({ count: count() })
      .from(EcommerceOrder)
      .where(this.placedOrderInStore(storeId));
    return row.count;
  }

  async storeOrder(storeId: string, orderId: string) {
    await this.trackStoreOrders(storeId);
    const [order] = await this.db
      .select({
        id: EcommerceOrder.id,
        status: EcommerceOrder.status,
        createdAt: EcommerceOrder.createdAt,
      })
      .from(EcommerceOrder)
      .where(
        and(eq(EcommerceOrder.id, orderId), this.placedOrderInStore(storeId)),
      );
    return order;
  }

  async storeOrders(input: {
    customerId?: string;
    storeId: string;
    offset: number;
    limit: number;
    search?: string;
  }) {
    const { storeId, offset, limit, search, customerId } = input;
    await this.trackStoreOrders(storeId);
    let customerScope;
    if (customerId) {
      const tasks = await this.customerTasks(storeId);
      const orders = await this.customerOrders(storeId, tasks);
      customerScope = inArray(
        EcommerceOrder.id,
        this.db
          .select({ id: orders.orderId })
          .from(orders)
          .where(eq(orders.subjectId, customerId)),
      );
    }
    const visible = and(
      this.placedOrderInStore(storeId),
      customerScope,
      search
        ? sql`strpos(${EcommerceOrder.id}::text, lower(${search})) > 0`
        : undefined,
    );
    const [items, [row]] = await Promise.all([
      this.db
        .select({
          id: EcommerceOrder.id,
          type: EcommerceOrder.type,
          status: EcommerceOrder.status,
          createdAt: EcommerceOrder.createdAt,
        })
        .from(EcommerceOrder)
        .where(visible)
        .orderBy(desc(EcommerceOrder.createdAt), desc(EcommerceOrder.id))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(EcommerceOrder).where(visible),
    ]);
    return { items, total: row.total };
  }

  async storeCatalogProductOrders(input: {
    storeId: string;
    productId: string;
    offset: number;
    limit: number;
  }) {
    const { storeId, productId, offset, limit } = input;
    const byStore = {
      and: [{ column: "storeId", method: "eq" as const, value: storeId }],
    };
    const byProduct = {
      and: [{ column: "productId", method: "eq" as const, value: productId }],
    };
    await trackRepositoryRead(EcommerceStoreOrder, this.db);
    await trackRepositoryRead(EcommerceOrderLine, this.db, byProduct);
    await trackRepositoryRead(EcommerceOffer, this.db, byStore);
    await trackRepositoryRead(EcommerceOrder, this.db);
    await trackRepositoryRead(CrmTaskOrder, this.db);
    await trackRepositoryRead(CrmTaskOffer, this.db);

    const otherStoreOrder = this.db
      .select({ id: EcommerceStoreOrder.id })
      .from(EcommerceStoreOrder)
      .where(
        and(
          ne(EcommerceStoreOrder.storeId, storeId),
          eq(EcommerceStoreOrder.orderId, EcommerceOrder.id),
        ),
      );
    const orders = await this.db
      .select({
        id: EcommerceOrder.id,
        type: EcommerceOrder.type,
        status: EcommerceOrder.status,
        createdAt: EcommerceOrder.createdAt,
        quantity: sum(EcommerceOrderLine.quantity).mapWith(Number),
      })
      .from(EcommerceOrder)
      .innerJoin(
        EcommerceOrderLine,
        eq(EcommerceOrderLine.orderId, EcommerceOrder.id),
      )
      .leftJoin(
        EcommerceOffer,
        eq(EcommerceOffer.id, EcommerceOrderLine.offerId),
      )
      .where(
        and(
          this.placedOrderInStore(storeId, productId),
          eq(EcommerceOrderLine.productId, productId),
          or(
            eq(EcommerceOffer.storeId, storeId),
            and(isNull(EcommerceOrderLine.offerId), notExists(otherStoreOrder)),
          ),
        ),
      )
      .groupBy(EcommerceOrder.id)
      .orderBy(desc(EcommerceOrder.createdAt), desc(EcommerceOrder.id))
      .limit(limit)
      .offset(offset);
    return orders;
  }

  async socialThreadActivity({
    subjectId,
    chatIds,
    threadIds,
  }: ISocialActivityScope) {
    if (!chatIds.length || threadIds?.length === 0) {
      return [];
    }

    const chatFilter = {
      and: [{ column: "chatId", method: "inArray" as const, value: chatIds }],
    };
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: subjectId }],
    });
    await trackRepositoryRead(ChatThread, this.db, chatFilter);
    await trackRepositoryRead(ChatMessage, this.db, chatFilter);
    await trackRepositoryRead(
      ThreadMessage,
      this.db,
      threadIds
        ? { and: [{ column: "threadId", method: "inArray", value: threadIds }] }
        : undefined,
    );
    await trackRepositoryRead(Message, this.db);
    await trackRepositoryRead(ProfileMessage, this.db);
    await trackRepositoryRead(SubjectProfile, this.db, {
      and: [{ column: "subjectId", method: "eq", value: subjectId }],
    });

    if (threadIds) {
      await trackRepositoryRead(ProfileChat, this.db, chatFilter);
      await trackRepositoryRead(MessageFile, this.db);
    }

    const cursor = sql`${Table.socialThreadReadCursors} ->
      (${ChatThread.chatId}::text || '/' || ${ChatThread.threadId}::text)`;
    const incoming = sql`NOT EXISTS (
      SELECT 1 FROM ${ProfileMessage}
      JOIN ${SubjectProfile}
        ON ${SubjectProfile.socialModuleProfileId} = ${ProfileMessage.profileId}
      WHERE ${ProfileMessage.messageId} = ${Message.id}
        AND ${SubjectProfile.subjectId} = ${subjectId}
        AND ${SubjectProfile.variant} <> 'assistant'
    )`;
    return this.db
      .selectDistinctOn([ChatThread.chatId, ChatThread.threadId], {
        chatId: ChatThread.chatId,
        threadId: ChatThread.threadId,
        lastMessageAt: sql<string>`to_char(${Message.createdAt}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
        ...(threadIds && {
          lastMessagePreview: sql<
            string | null
          >`left(${Message.description}, 240)`,
          lastMessageAuthorId: sql<string | null>`(
            SELECT ${ProfileMessage.profileId} FROM ${ProfileMessage}
            JOIN ${ProfileChat} ON ${ProfileChat.profileId} = ${ProfileMessage.profileId}
              AND ${ProfileChat.chatId} = ${ChatThread.chatId}
            WHERE ${ProfileMessage.messageId} = ${Message.id}
            ORDER BY ${ProfileMessage.createdAt}, ${ProfileMessage.id} LIMIT 1
          )`,
          lastMessageHasFiles: sql<boolean>`CASE WHEN ${Message.variant} = 'customer-work' THEN
            coalesce(${Message.metadata}->'customerWorkAttachments'->0, ${Message.metadata}->'customerWorkMedia') IS NOT NULL
            ELSE EXISTS (SELECT 1 FROM ${MessageFile} WHERE ${MessageFile.messageId} = ${Message.id}) END`,
        }),
        unreadCount: sql<number>`(count(*) FILTER (WHERE ${incoming}
          AND ${Message.createdAt} > ${Table.socialThreadReadsSince} AND (
          (${cursor} ->> 'createdAt') IS NULL OR
          (${Message.createdAt}, ${Message.id}) >
            ((${cursor} ->> 'createdAt')::timestamp, (${cursor} ->> 'messageId')::uuid)
        )) OVER (PARTITION BY ${ChatThread.chatId}, ${ChatThread.threadId}))::integer`,
      })
      .from(ChatThread)
      .innerJoin(ThreadMessage, eq(ThreadMessage.threadId, ChatThread.threadId))
      .innerJoin(Message, eq(Message.id, ThreadMessage.messageId))
      .innerJoin(
        ChatMessage,
        and(
          eq(ChatMessage.chatId, ChatThread.chatId),
          eq(ChatMessage.messageId, Message.id),
        ),
      )
      .innerJoin(Table, eq(Table.id, subjectId))
      .where(
        and(
          inArray(ChatThread.chatId, chatIds),
          threadIds ? inArray(ChatThread.threadId, threadIds) : undefined,
        ),
      )
      .orderBy(
        ChatThread.chatId,
        ChatThread.threadId,
        desc(Message.createdAt),
        desc(Message.id),
      );
  }

  async advanceSocialThreadReadCursor({
    subjectId,
    chatId,
    threadId,
    messageId,
  }: ISocialReadScope) {
    const [marker] = await this.db
      .select({
        messageId: Message.id,
        createdAt: sql<string>`${Message.createdAt}::text`,
      })
      .from(Message)
      .innerJoin(
        ThreadMessage,
        and(
          eq(ThreadMessage.threadId, threadId),
          eq(ThreadMessage.messageId, Message.id),
        ),
      )
      .innerJoin(
        ChatMessage,
        and(
          eq(ChatMessage.chatId, chatId),
          eq(ChatMessage.messageId, Message.id),
        ),
      )
      .innerJoin(
        ChatThread,
        and(eq(ChatThread.chatId, chatId), eq(ChatThread.threadId, threadId)),
      )
      .where(eq(Message.id, messageId));
    if (!marker) {
      throw new Error(
        "Not Found error. The message is unavailable in this thread",
      );
    }

    const key = `${chatId}/${threadId}`;
    const cursor = sql`${Table.socialThreadReadCursors} -> ${key}`;
    await this.db
      .update(Table)
      .set({
        socialThreadReadCursors: sql`jsonb_set(
          ${Table.socialThreadReadCursors}, ARRAY[${key}]::text[],
          ${JSON.stringify(marker)}::jsonb
        )`,
      })
      .where(
        and(
          eq(Table.id, subjectId),
          sql`((${cursor} ->> 'createdAt') IS NULL OR
          ((${cursor} ->> 'createdAt')::timestamp, (${cursor} ->> 'messageId')::uuid)
            < (${marker.createdAt}::timestamp, ${marker.messageId}::uuid))`,
        ),
      );
  }

  withCatalogLock<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
    return this.withScopedLocks("rbac.catalog", keys, operation);
  }

  withChatSettingsLock<T>(chatId: string, operation: () => Promise<T>) {
    return this.withScopedLocks("rbac.chat-settings", [chatId], operation);
  }

  withStoreEmployeeLock<T>(actorId: string, operation: () => Promise<T>) {
    return this.withScopedLocks("rbac.store-employee", [actorId], operation);
  }

  withWalletLocks<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
    return this.withScopedLocks("rbac.wallet", keys, operation);
  }

  private withScopedLocks<T>(
    namespace: string,
    keys: string[],
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      for (const key of [...new Set(keys)].sort()) {
        await this.db.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${`${namespace}:${key}`}))`,
        );
      }
      return operation();
    };
    if (consistencyContext.getStore()?.database) {
      return run();
    }
    return withConsistencyTransaction(this.db, run);
  }

  withSubjectLock<T>(
    scope: { subjectId: string; savepoint?: boolean },
    operation: () => Promise<T>,
  ): Promise<T> {
    const run = async () => {
      await this.db.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
      );
      return operation();
    };
    if (consistencyContext.getStore()?.database && !scope.savepoint) {
      return run();
    }
    return withConsistencyTransaction(this.db, run);
  }

  async tryLockDeliverySubject(subjectId: string) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error("Order delivery lock requires an owner transaction");
    }
    const [row] = await this.db.execute<{ locked: boolean }>(
      sql`SELECT pg_try_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${subjectId}`})) AS locked`,
    );
    return row.locked;
  }

  async lockOrderDelivery(scope: { subjectId: string; orderId: string }) {
    if (!consistencyContext.getStore()?.database)
      throw new Error("Order delivery lock requires an owner transaction");
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.subject:${scope.subjectId}`}))`,
    );
    await this.db.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${`rbac.order-delivery.order:${scope.orderId}`}))`,
    );
  }

  async lockCartGuest(subjectId: string) {
    if (!consistencyContext.getStore()?.database) {
      throw new Error("Guest cart lock requires a subject transaction");
    }
    // Identity links reference this row. Registration and logout must serialize
    // with the guest check and ownership changes in the same transaction.
    await trackRepositoryRead(Table, this.db, {
      and: [{ column: "id", method: "eq", value: subjectId }],
    });
    const [guest] = await this.db
      .select({
        variant: Table.variant,
        tokensValidAfter: Table.tokensValidAfter,
      })
      .from(Table)
      .where(eq(Table.id, subjectId))
      .for("update");
    return guest;
  }

  withOrderDelivery<T>(
    scope: { subjectId: string; orderId: string },
    operation: () => Promise<T>,
  ) {
    return this.withSubjectLock(scope, async () => {
      await this.lockOrderDelivery(scope);
      return operation();
    });
  }
}
