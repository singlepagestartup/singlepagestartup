// Run against a local test installation from apps/api with an existing seller's Subject ID.
import { createHash } from "node:crypto";
import { DATABASE_HOST } from "@sps/shared-utils";
import { createAppAssembly } from "@sps/shared-backend-api";
import { createService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { Service as ProfileKnowledge } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/sources";

interface IPreparedService {
  slug: string;
  productId: string;
  offerId: string;
  employeeId: string;
  funnelId: string;
}

interface IService {
  slug: string;
  title: [string, string];
  specialist: [string, string];
  method: string;
  visual?: boolean;
  expertReference?: string;
}

const services: IService[] = [
  {
    slug: "business-brief",
    title: ["Бриф бизнеса", "Business brief"],
    specialist: ["Аккаунт-менеджер", "Account manager"],
    method:
      "Проверяй каждую цифру по материалу клиента. Спроси о противоречиях. Зафиксируй единицу продажи, условия и ограничения; отметь неизвестное.",
  },
  {
    slug: "offer-analysis",
    title: ["Описание предложения", "Offer analysis"],
    specialist: ["Бизнес-аналитик", "Business analyst"],
    method:
      "Отделяй известные затраты от предположений. Приведи формулу, единицу продажи и последовательность покупки.",
  },
  {
    slug: "competitor-study",
    title: ["Исследование конкурентов", "Competitor study"],
    specialist: ["Исследователь рынка", "Market researcher"],
    method:
      "Сравни по одной задаче покупателя. Подкрепи различия переданными источниками, укажи дату. При нехватке данных запроси материалы.",
  },
  {
    slug: "search-demand",
    title: ["Поисковый спрос", "Search demand"],
    specialist: ["Исследователь спроса", "Search analyst"],
    method:
      "Укажи источник, регион и период измерения. Объедини запросы по намерению, объясни связь каждой группы с предложением.",
  },
  {
    slug: "promotion-strategy",
    expertReference:
      "В методике этой мастерской эксперимент сравнивают по семи квалифицированным обращениям на канал. В отчёте отдельно указывают заявки вне целевой аудитории.",
    title: ["Стратегия продвижения", "Promotion strategy"],
    specialist: ["Маркетинговый стратег", "Marketing strategist"],
    method:
      "Начни с ограничений из брифа покупателя. Сопоставь два канала по стоимости получения квалифицированной заявки. Предложи один проверяемый эксперимент и критерий остановки.",
  },
  {
    slug: "brand-voice",
    title: ["Бренд и коммуникация", "Brand and messaging"],
    specialist: ["Стратег по коммуникации", "Communications strategist"],
    method:
      "Для каждого обещания назови основание. Дай примеры текста для одного сегмента и правила тона.",
  },
  {
    slug: "visual-identity",
    title: ["Визуальное направление", "Visual direction"],
    specialist: ["Бренд-дизайнер", "Brand designer"],
    method:
      "Покажи палитру, типографику и один пример применения к предложению клиента в одном изображении.",
    visual: true,
  },
  {
    slug: "campaign-creative",
    title: ["Рекламный креатив", "Campaign creative"],
    specialist: ["Дизайнер рекламы", "Campaign designer"],
    method:
      "Уточни носитель, размеры и действие аудитории. Подготовь креатив в этом формате, согласуй текст и используй предоставленные права на материалы.",
    visual: true,
  },
];

const by = (column: string, value: string) => ({
  params: { filters: { and: [{ column, method: "eq" as const, value }] } },
});

async function setup(ownerId: string) {
  const subject = createService(createAppAssembly());
  const { ecommerce, social, billing, knowledge, crm } = subject.modules;
  const slug = "framework-agent-services";
  const [token] = await billing.currency.find(by("slug", "token"));
  if (!token) throw new Error("Seed the token currency first.");
  if (!(await subject.findById({ id: ownerId })))
    throw new Error("Unknown seller Subject.");
  if (!["localhost", "127.0.0.1", "::1"].includes(DATABASE_HOST)) {
    throw new Error("Framework service fixtures require a local database.");
  }
  const [store] = await ecommerce.store.find(by("slug", slug));
  if (!store) {
    throw new Error(
      "Apply the Framework service catalog seed before preparing employees.",
    );
  }
  const catalog = await Promise.all(
    services.map(async (service) => {
      const productSlug = "framework-" + service.slug;
      const [product] = await ecommerce.product.find(by("slug", productSlug));
      if (product?.kind !== "service")
        throw new Error("Missing service: " + productSlug);
      const offers = await ecommerce.storesToProducts.find(
        by("productId", product.id),
      );
      const offer = offers.find((row) => row.storeId === store.id);
      if (!offer)
        throw new Error("Missing service store offer: " + productSlug);
      return { service, product, offer };
    }),
  );
  await subject.repository.withStoreEmployeeLock(store.id, async () => {
    const grants = await subject.module.subjectsToEcommerceModuleStores.find(
      by("ecommerceModuleStoreId", store.id),
    );
    const owners = grants.filter((link) => link.variant === "owner");
    if (owners.length && !owners.some((link) => link.subjectId === ownerId)) {
      throw new Error("The supplied seller does not own the service store.");
    }
    if (!owners.length) {
      await subject.module.subjectsToEcommerceModuleStores.create({
        data: {
          subjectId: ownerId,
          ecommerceModuleStoreId: store.id,
          variant: "owner",
        },
      });
    }
  });
  const records: IPreparedService[] = [];
  for (const { service, product, offer } of catalog) {
    const productSlug = product.slug;
    const created = await subject.crmWorkspace.execute(ownerId, {
      kind: "create-employee",
      employee: {
        storeId: store.id,
        name: service.specialist[0],
        operationKey: createHash("sha256")
          .update(productSlug)
          .digest("hex")
          .slice(0, 32)
          .replace(/^(.{8})(.{4}).(.{3}).(.{3})(.{12})$/, "$1-$2-5$3-8$4-$5"),
      },
    });
    if (created.kind !== "create-employee")
      throw new Error("Expected a store employee.");
    const employee = created.data;
    const assignees =
      await subject.module.subjectsToEcommerceModuleProducts.find(
        by("ecommerceModuleProductId", product.id),
      );
    if (
      !assignees.some(
        (row) =>
          row.subjectId === employee.id && row.variant === "store-expert",
      )
    ) {
      await subject.module.subjectsToEcommerceModuleProducts.create({
        data: {
          subjectId: employee.id,
          ecommerceModuleProductId: product.id,
          variant: "store-expert",
        },
      });
    }
    let [skill] = await social.skill.find(by("slug", productSlug));
    if (!skill)
      skill = await social.skill.create({
        data: {
          slug: productSlug,
          title: service.title[0],
          description: service.method,
        },
      });
    const skills = await social.profilesToSkills.find(
      by("profileId", employee.profileId),
    );
    if (!skills.some((row) => row.skillId === skill.id))
      await social.profilesToSkills.create({
        data: { profileId: employee.profileId, skillId: skill.id },
      });
    let source = await knowledge.source.upsertSourceBySlug(
      {
        slug: productSlug + "-expert-reference",
        title: service.specialist[0],
        content: service.expertReference ?? service.method,
        variant: "default",
      },
      true,
    );
    if (service.expertReference && source.content !== service.expertReference) {
      const updated = await knowledge.source.updateSource({
        sourceId: source.id,
        content: service.expertReference,
        expectedContentHash: source.contentHash!,
      });
      if (!updated)
        throw new Error("The expert reference changed during setup.");
      source = updated;
    }
    const references = await social.profilesToKnowledgeModuleSources.find(
      by("profileId", employee.profileId),
    );
    if (!references.some((row) => row.knowledgeModuleSourceId === source.id))
      await social.profilesToKnowledgeModuleSources.create({
        data: {
          profileId: employee.profileId,
          knowledgeModuleSourceId: source.id,
          variant: "default",
        },
      });
    if (source.indexedContentHash !== source.contentHash)
      await new ProfileKnowledge(subject).index(source.id);
    const employeeStage = {
      defaultAssigneeSubjectId: employee.id,
      skillIds: [skill.id],
    };
    const workFunding = {
      payer: "customer" as const,
      multiplier: "0",
      currencyId: token.id,
      maxStageAmount: "0",
      maxRunAmount: "0",
    };
    const funnel = await crm.funnel.save({
      operationKey: productSlug,
      storeId: store.id,
      name: service.title[0],
      kind: "individual-service",
      bindings: { offerIds: [offer.id] },
      definition: {
        initialStageId: "intake",
        stages: [
          {
            id: "intake",
            name: "Уточнение задачи",
            ...employeeStage,
            workFunding,
            instruction:
              "Выясни вводные и согласуй результат с клиентом. " +
              service.method,
            actions: [
              {
                id: "prepare",
                name: "Подготовить результат",
                actors: ["ai", "human"],
                evidence: ["model-result"],
                nextStageId: "prepare",
              },
            ],
          },
          {
            id: "prepare",
            name: "Результат и правки",
            ...employeeStage,
            workFunding,
            instruction: service.method,
            output: service.visual ? "image" : "pdf",
            actions: [
              {
                id: "accept",
                name: "Принять версию",
                actors: ["system"],
                evidence: ["result-accepted"],
                nextStageId: "payment",
              },
            ],
          },
          {
            id: "payment",
            name: "Оплата",
            behavior: "ecommerce-module-order-payment",
            ...employeeStage,
            workFunding,
            actions: [
              {
                id: "paid",
                name: "Оплачено",
                actors: ["system"],
                evidence: ["payment"],
                nextStageId: "delivery",
              },
            ],
          },
          {
            id: "delivery",
            name: "Выдача оригинала",
            behavior: "order-file-delivery",
            ...employeeStage,
            workFunding,
            actions: [
              {
                id: "release",
                name: "Выдать результат",
                actors: ["system"],
                evidence: ["delivery"],
                deliveryStage: "delivered",
                outcome: "completed",
              },
            ],
          },
        ],
      },
    });
    records.push({
      slug: product.slug,
      productId: product.id,
      offerId: offer.id,
      employeeId: employee.id,
      funnelId: funnel.id,
    });
  }
  return { storeId: store.id, services: records };
}

const ownerId = process.argv[2];
if (!ownerId)
  throw new Error(
    "Usage: bun --tsconfig-override ./tsconfig.json --env-file=.env ../../tools/testing/framework-agent-services.ts SELLER_SUBJECT_ID (from apps/api)",
  );
console.log(JSON.stringify(await setup(ownerId), null, 2));
process.exit(0);
