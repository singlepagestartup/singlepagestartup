// Run against a local test installation from apps/api with an existing seller's Subject ID.
import { createHash } from "node:crypto";
import { v5 as funnelIdFromKey } from "uuid";
import { z } from "zod";
import { DATABASE_HOST, OPEN_AI_STAGE_TEXT_DEFAULT } from "@sps/shared-utils";
import { createAppAssembly } from "@sps/shared-backend-api";
import { createService as createWorkAttempts } from "@sps/agent/models/work-attempt/backend/app/api/src/lib/bootstrap";
import { createService } from "@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap";
import { Service as ProfileKnowledge } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/sources";
import type {
  IFunnelStage,
  ISaveFunnel,
} from "@sps/crm/models/funnel/sdk/model";
import { isSocialMessageExcludedFromOpenRouter } from "@sps/social/models/message/sdk/model";

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

const legacyBriefOfferId = "779f2512-b7a2-4785-93a8-aca7ada1e7bc";
const briefProvider = {
  modelId: OPEN_AI_STAGE_TEXT_DEFAULT.modelId,
  reasoning: "medium",
} as const;
// The $0.75 provider limit at 2× and 769.230769 SPS per USD is 1153.8461535 SPS.
const briefMaxRunAmount = "1200";

async function publishBriefFunnel(
  subject: ReturnType<typeof createService>,
  attempts: ReturnType<typeof createWorkAttempts>,
  ownerId: string,
  offerId: string,
  input: ISaveFunnel & { operationKey: string },
  moveTaskId: string | undefined,
  orderFormula: boolean,
) {
  if (moveTaskId && orderFormula) {
    throw new Error(
      "Existing Brief orders keep their original terms and workflow.",
    );
  }
  const { crm, ecommerce, social } = subject.modules;
  return subject.repository.withStoreEmployeeLock(input.storeId, async () => {
    const owners = await subject.module.subjectsToEcommerceModuleStores.find(
      by("ecommerceModuleStoreId", input.storeId),
    );
    if (
      !owners.some(
        (grant) => grant.variant === "owner" && grant.subjectId === ownerId,
      )
    ) {
      throw new Error("The supplied seller no longer owns the service store.");
    }
    const previousId = funnelIdFromKey(input.operationKey, input.storeId);
    const previousIds = orderFormula
      ? [
          previousId,
          funnelIdFromKey(`${input.operationKey}-astra`, input.storeId),
        ]
      : [previousId];
    const offerLinks = crm.funnelsToEcommerceModuleStoresToProducts;
    const oldOfferLinks: string[] = [];
    for (const id of previousIds) {
      const saved = await crm.funnel.findById({ id });
      if (!saved) {
        continue;
      }
      await crm.funnel.lock(input.storeId, id, "update");
      const previous = await crm.funnel.current(input.storeId, id);
      const [link] = await offerLinks.find({
        params: {
          filters: {
            and: [
              ...by("funnelId", previous.id).params.filters.and,
              ...by("offerId", offerId).params.filters.and,
            ],
          },
        },
      });
      if (!link) {
        continue;
      }
      if (
        previous.bindings.storeWide !== false ||
        previous.bindings.formIds.length
      ) {
        throw new Error("The legacy Brief funnel has other entry points.");
      }
      oldOfferLinks.push(link.id);
    }
    const next = await crm.funnel.save({
      ...input,
      operationKey: `${input.operationKey}-${orderFormula ? "chat" : "astra"}`,
      name: `${input.name} (GPT-6.2 Astra)`,
    });
    await crm.funnel.lock(input.storeId, next.id, "share");
    for (const oldOfferLink of oldOfferLinks) {
      await offerLinks.delete({ id: oldOfferLink });
    }
    if (moveTaskId) {
      await crm.task.moveUnstartedTask(
        {
          storeId: input.storeId,
          taskId: moveTaskId,
          fromId: previousId,
          toId: next.id,
          offerId,
        },
        async (orderId) => {
          const [work, runs, channels] = await Promise.all([
            ecommerce.order.work.findByOrder(orderId),
            attempts.find({
              params: { ...by("taskId", moveTaskId).params, limit: 1 },
            }),
            social.chatsToCrmModuleTasks.channels({ taskId: moveTaskId }),
          ]);
          if (
            !work ||
            work.taskId !== moveTaskId ||
            work.storeId !== input.storeId ||
            work.paymentMode !== "work-tokens" ||
            work.state !== "awaiting-result" ||
            work.paid ||
            work.files.length ||
            work.decisions.length ||
            runs.length ||
            !channels.length
          ) {
            throw new Error(
              "The task already has work or no longer matches this offer.",
            );
          }
          const messages = await social.threadsToMessages.find({
            params: {
              filters: {
                and: [
                  {
                    column: "threadId",
                    method: "inArray",
                    value: channels.map(({ threadId }) => threadId),
                  },
                ],
              },
            },
          });
          for (const placement of messages) {
            const message = await social.message.findById({
              id: placement.messageId,
            });
            if (
              !message?.workReplyKey?.startsWith(`order-status:${orderId}:`) ||
              !isSocialMessageExcludedFromOpenRouter(message.metadata)
            ) {
              throw new Error(
                "The task’s conversation already has work messages.",
              );
            }
          }
        },
      );
    }
    const current = await crm.funnel.resolve({
      storeId: input.storeId,
      offerId,
      kind: input.kind,
    });
    if (current?.id !== next.id) {
      throw new Error("The Brief offer still resolves to a different funnel.");
    }
    return next;
  });
}

async function setup(
  ownerId: string,
  options: { briefOnly: boolean; skipIndex: boolean; moveTaskId?: string },
) {
  const assembly = createAppAssembly();
  const subject = createService(assembly);
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
    services
      .filter(
        (service) => !options.briefOnly || service.slug === "business-brief",
      )
      .map(async (service) => {
        const productSlug = "framework-" + service.slug;
        const [product] = await ecommerce.product.find(by("slug", productSlug));
        if (product?.kind !== "service")
          throw new Error("Missing service: " + productSlug);
        const offers = await ecommerce.storesToProducts.find(
          by("productId", product.id),
        );
        const offer = offers.find(
          (row) => row.storeId === store.id && !row.settings.closedForNewOrders,
        );
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
    if (service.slug === "business-brief") {
      const legacy = await ecommerce.storesToProducts.findById({
        id: legacyBriefOfferId,
      });
      if (
        legacy?.storeId === store.id &&
        legacy.productId === product.id &&
        legacy.settings.closedForNewOrders &&
        !legacy.settings.fullTextDraftPreview
      ) {
        await ecommerce.storesToProducts.update({
          id: legacy.id,
          data: {
            settings: { ...legacy.settings, fullTextDraftPreview: true },
          },
        });
      }
    }
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
    if (!options.skipIndex && source.indexedContentHash !== source.contentHash)
      await new ProfileKnowledge(subject).index(source.id);
    const employeeStage = {
      defaultAssigneeSubjectId: employee.id,
      skillIds: [skill.id],
    };
    const metered = offer.settings.workTokenPricing;
    const meteredBrief = metered && service.slug === "business-brief";
    const orderFormula = Boolean(metered && metered.multiplier === undefined);
    const workFunding = {
      payer: "customer" as const,
      ...(orderFormula
        ? { orderFormula: true as const }
        : { multiplier: metered?.multiplier ?? "0" }),
      currencyId: token.id,
      maxRunAmount: metered ? (meteredBrief ? briefMaxRunAmount : "100") : "0",
      ...(!metered && { maxStageAmount: "0" }),
    };
    const paidWork = metered
      ? {
          provider: meteredBrief
            ? briefProvider
            : { modelId: "gpt-5.4-mini-2026-03-17" },
          operations: ["knowledge-search"] as const,
        }
      : undefined;
    const cashStages: IFunnelStage[] = [
      {
        id: "payment",
        name: "Оплата",
        instruction: "",
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
        instruction: "",
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
    ];
    const collaborativeStage: IFunnelStage = {
      id: "work",
      name: "Работа с экспертом",
      ...employeeStage,
      workFunding,
      provider: paidWork?.provider,
      operations: paidWork && [...paidWork.operations],
      instruction: [
        service.method,
        "Работай над задачей в чате. Если данных достаточно для части работы, покажи её и уточни то, что ещё нужно. Учитывай предыдущие ответы и правки клиента. По просьбе клиента прикрепи рабочий документ и укажи в нём открытые вопросы.",
      ].join(" "),
      output: service.visual ? "image" : "pdf",
      actions: [
        {
          id: "finish",
          name: "Завершить работу",
          instruction:
            "Заверши работу, только если в последнем сообщении клиент прямо просит её завершить и не просит внести правки.",
          actors: ["ai"],
          evidence: ["model-result"],
          outcome: "completed",
        },
      ],
    };
    const funnelInput = {
      operationKey: metered ? productSlug + "-work-tokens" : productSlug,
      storeId: store.id,
      name: metered ? service.title[0] + " за токены" : service.title[0],
      kind: "individual-service",
      bindings: { offerIds: [offer.id] },
      definition: {
        initialStageId: orderFormula ? collaborativeStage.id : "intake",
        stages: orderFormula
          ? [collaborativeStage]
          : [
              {
                id: "intake",
                name: "Уточнение задачи",
                ...employeeStage,
                workFunding,
                provider: paidWork?.provider,
                operations: paidWork && [...paidWork.operations],
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
                provider: paidWork?.provider,
                operations: paidWork && [...paidWork.operations],
                resultPricing: metered ? { kind: "work-tokens" } : undefined,
                instruction: metered
                  ? [
                      service.method,
                      "Составь полный рабочий бриф на русском. Зафиксируй цели, проверенные факты, ограничения и открытые вопросы. Открытые вопросы отметь в самом брифе. Если недостающие сведения не мешают подготовке полезного брифа, выпусти черновик.",
                    ].join(" ")
                  : service.method,
                output: service.visual ? "image" : "pdf",
                actions: [
                  {
                    id: "accept",
                    name: "Принять версию",
                    actors: ["system"],
                    evidence: ["result-accepted"],
                    ...(metered
                      ? { outcome: "completed" as const }
                      : { nextStageId: "payment" }),
                  },
                ],
              },
              ...(metered ? [] : cashStages),
            ],
      },
    } satisfies ISaveFunnel;
    const funnel = meteredBrief
      ? await publishBriefFunnel(
          subject,
          createWorkAttempts(assembly),
          ownerId,
          offer.id,
          funnelInput,
          options.moveTaskId,
          orderFormula,
        )
      : await crm.funnel.save(funnelInput);
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
    "Usage: bun --tsconfig-override ./tsconfig.json --env-file=.env ../../tools/testing/framework-agent-services.ts SELLER_SUBJECT_ID [--brief-only] [--skip-index] [--move-unstarted-brief-task=TASK_ID] (from apps/api)",
  );
const flags = process.argv.slice(3);
const moveTaskFlag = "--move-unstarted-brief-task";
const moveTaskOption = flags.find(
  (flag) => flag === moveTaskFlag || flag.startsWith(`${moveTaskFlag}=`),
);
const moveTaskId = moveTaskOption
  ? z.uuid().parse(moveTaskOption.slice(moveTaskFlag.length + 1))
  : undefined;
console.log(
  JSON.stringify(
    await setup(ownerId, {
      briefOnly: flags.includes("--brief-only"),
      skipIndex: flags.includes("--skip-index"),
      moveTaskId,
    }),
    null,
    2,
  ),
);
process.exit(0);
