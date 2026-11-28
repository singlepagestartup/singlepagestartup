import type { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import type {
  ILinkedChatProduct,
  ISocialModuleChatThread,
} from "@sps/rbac/models/subject/sdk/model";
import type { SubjectServiceDependencies } from "../../index";

export class Service {
  constructor(private readonly subject: SubjectServiceDependencies) {}

  async enrich(
    threads: ISocialModuleThread[],
  ): Promise<ISocialModuleChatThread[]> {
    if (!threads.length) {
      return [];
    }

    const { social, ecommerce } = this.subject.modules;
    const threadIdFilter = {
      column: "threadId",
      method: "inArray" as const,
      value: threads.map(({ id }) => id),
    };
    const params = { filters: { and: [threadIdFilter] } };
    const [workLinks, productLinks] = await Promise.all([
      social.chatsToCrmModuleTasks.channels({
        threadIds: threadIdFilter.value,
      }),
      social.threadsToEcommerceModuleProducts.find({
        params: {
          ...params,
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
        },
      }),
    ]);
    const visibleLinks = productLinks.filter(
      ({ variant }) => variant !== "hidden",
    );
    const productsById = new Map<string, ILinkedChatProduct>();
    if (visibleLinks.length) {
      const productIds = new Set(
        visibleLinks.map(
          ({ ecommerceModuleProductId }) => ecommerceModuleProductId,
        ),
      );
      const products = await ecommerce.product.find({
        params: {
          filters: {
            and: [{ column: "id", method: "inArray", value: [...productIds] }],
          },
        },
      });
      for (const { id, slug, title, variant } of products) {
        if (variant !== "hidden") {
          productsById.set(id, { id, slug, title });
        }
      }
    }
    const productIdsByThread = new Map<string, Set<string>>();
    for (const link of visibleLinks) {
      const productIds =
        productIdsByThread.get(link.threadId) ?? new Set<string>();
      productIds.add(link.ecommerceModuleProductId);
      productIdsByThread.set(link.threadId, productIds);
    }
    const workThreadIds = new Set(workLinks.map(({ threadId }) => threadId));

    return threads.map((thread) => ({
      ...thread,
      hasCustomerWork: workThreadIds.has(thread.id),
      linkedProducts: [...(productIdsByThread.get(thread.id) ?? [])].flatMap(
        (id) => {
          const product = productsById.get(id);
          return product ? [product] : [];
        },
      ),
    }));
  }
}
