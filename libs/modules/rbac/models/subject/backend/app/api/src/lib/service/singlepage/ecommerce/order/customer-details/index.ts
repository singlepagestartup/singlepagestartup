import { addMoney, getHttpErrorType } from "@sps/backend-utils";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import {
  orderArtifactPath,
  type ICustomerOrderCheckout,
  type ICustomerOrderDelivery,
} from "@sps/rbac/models/subject/sdk/model";
import type { IModel as ICurrency } from "@sps/billing/models/currency/sdk/model";
import { collectOrderLines, distinctDeliveries, lineDelivery } from "./utils";
import type { IModel as IProduct } from "@sps/ecommerce/models/product/sdk/model";
import { Service as Checkout } from "./checkout";
import type { ISubjectCustomerOrderDetails } from "@sps/rbac/models/subject/sdk/model";
import type { SubjectServiceDependencies } from "../../../index";
import { inIds } from "../../customer-work/utils";

export interface IExecuteProps {
  subjectId: string;
  ownedHistoryOrderIds: string[];
  requestedOrderId?: string;
}

interface IConstructorProps {
  service: SubjectServiceDependencies<
    | "customerWork"
    | "socialModuleChatLifecycleAssertSubjectOwnsChat"
    | "orderWork"
    | "protectedFile"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute({
    subjectId,
    ownedHistoryOrderIds,
    requestedOrderId,
  }: IExecuteProps) {
    const details = new Map<string, ISubjectCustomerOrderDetails>();
    for (const id of ownedHistoryOrderIds) {
      details.set(id, { lines: [] });
    }
    if (!details.size) {
      return details;
    }
    const { service } = this.dependencies;
    const { ecommerce, billing } = service.modules;
    const checkout = new Checkout(service);
    const [lines, payments, states] = await Promise.all([
      ecommerce.ordersToProducts.find(inIds("orderId", ownedHistoryOrderIds)),
      checkout.payments(ownedHistoryOrderIds, subjectId, requestedOrderId),
      ecommerce.order.work.statesForCustomer(subjectId, ownedHistoryOrderIds),
    ]);
    const currencyIds = new Set<string>();
    for (const payment of payments.values()) {
      if (payment.currencyId) {
        currencyIds.add(payment.currencyId);
      }
      for (const link of payment.links) {
        if (link.purchaseSnapshot?.currencyId) {
          currencyIds.add(link.purchaseSnapshot.currencyId);
        }
      }
    }
    const workPrices = new Map<string, { price: string; currencyId: string }>();
    const exactCheckout: ICustomerOrderCheckout = {};
    for (const { orderId, state } of states) {
      const order = details.get(orderId);
      if (!order) {
        continue;
      }
      order.workState = state;
      if (
        orderId !== requestedOrderId &&
        (payments.has(orderId) || state !== "awaiting-payment")
      ) {
        continue;
      }
      const work = await ecommerce.order.work.findByOrder(orderId);
      if (!work || work.customerId !== subjectId || work.orderId !== orderId) {
        continue;
      }
      const accepted = work.files.find(
        (file) => file.id === work.acceptedFileId,
      );
      const price = work.paid ?? accepted;
      if (price) {
        workPrices.set(orderId, {
          price: price.price,
          currencyId: price.currencyId,
        });
        currencyIds.add(price.currencyId);
      }
      if (orderId === requestedOrderId && work.paid) {
        exactCheckout.paidAt = work.paid.paidAt;
        if (
          work.kind === "individual-service" &&
          work.deliveredAt &&
          work.resultFileId
        ) {
          exactCheckout.delivery = [{ kind: "digital" }];
        }
        if (work.receiptFileId) {
          const path = orderArtifactPath(
            subjectId,
            orderId,
            work.receiptFileId,
          );
          if (await service.protectedFile.hasGrant(subjectId, path, "GET")) {
            exactCheckout.receipts = [{ id: work.receiptFileId, path }];
          }
        }
      }
    }
    const byOrder = collectOrderLines(ownedHistoryOrderIds, lines, payments);
    const productIds = [...byOrder.values()].flatMap((orderLines) =>
      [...orderLines.values()].map((line) => line.productId),
    );
    const products = productIds.length
      ? await ecommerce.product.find(inIds("id", productIds))
      : [];
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const [covers, currencies] = await Promise.all([
      this.covers(products),
      currencyIds.size ? billing.currency.find(inIds("id", currencyIds)) : [],
    ]);
    const currencyById = new Map<string, ICurrency>();
    for (const currency of currencies) {
      currencyById.set(currency.id, currency);
    }
    for (const [orderId, order] of details) {
      const orderLines = [...byOrder.get(orderId)!.values()];
      const payment = payments.get(orderId);
      const work = workPrices.get(orderId);
      const snapshots =
        payment?.links.flatMap((link) =>
          link.purchaseSnapshot ? [link.purchaseSnapshot] : [],
        ) ?? [];
      const first = snapshots[0];
      let total = checkout.money(
        work?.price,
        currencyById.get(work?.currencyId ?? ""),
      );
      if (
        !total &&
        first &&
        snapshots.every(
          (snapshot) =>
            snapshot.currencyId === first.currencyId &&
            snapshot.orderAmount === first.orderAmount,
        )
      ) {
        total = checkout.money(
          first.orderAmount,
          currencyById.get(first.currencyId),
        );
      }
      if (!total && payment?.singleOrder) {
        total = checkout.money(
          payment.amount,
          currencyById.get(payment.currencyId ?? ""),
        );
      }
      const delivery: ICustomerOrderDelivery[] = [];
      for (const line of orderLines) {
        const product = productById.get(line.productId);
        const saved = payment?.saved?.ordersToProducts?.find(
          (saved) =>
            saved.id === line.id &&
            saved.orderId === orderId &&
            saved.productId === line.productId,
        );
        const snapshot = payment?.links.find(
          (link) =>
            link.orderLineId === line.id &&
            link.purchaseSnapshot?.charge.productId === line.productId,
        )?.purchaseSnapshot;
        const charge = snapshot?.charge;
        const quantity = charge?.quantity ?? saved?.quantity ?? line.quantity;
        const historical = saved?.products?.find(
          (entry) => entry.id === line.productId,
        )?.title;
        let title = historical ?? product?.title ?? {};
        if (
          !historical &&
          charge?.title &&
          charge.title !== line.productId &&
          !Object.values(title).includes(charge.title)
        ) {
          title = { und: charge.title };
        }
        let price = checkout.money(
          snapshot?.amount,
          currencyById.get(snapshot?.currencyId ?? ""),
        );
        const checkoutCurrency = currencyById.get(payment?.currencyId ?? "");
        if (
          !price &&
          orderLines.length === 1 &&
          (work || (saved && payment?.saved?.ordersToProducts?.length === 1))
        ) {
          price = total;
        }
        if (!price && saved && checkoutCurrency) {
          price = checkout.savedLinePrice(saved, checkoutCurrency);
        }
        const productSlug =
          product?.variant === "default" ? product.slug : undefined;
        order.lines.push({
          id: line.id,
          productId: line.productId,
          title,
          quantity,
          ...(productSlug && { productSlug }),
          ...(covers.has(line.productId) && {
            coverUrl: covers.get(line.productId),
          }),
          ...(price && { price }),
        });
        if (requestedOrderId === orderId) {
          const destination =
            snapshot?.destination ?? saved?.destination ?? line.destination;
          const entry = lineDelivery(destination, charge, price);
          if (entry) {
            delivery.push(entry);
          }
        }
      }
      if (orderId !== requestedOrderId) {
        continue;
      }
      // Older checkouts can share an intent while retaining exact per-line prices in one currency.
      if (
        !total &&
        order.lines.length &&
        payment?.currencyId &&
        snapshots.every((item) => item.currencyId === payment.currencyId) &&
        order.lines.every((line) => line.price)
      ) {
        const amount = order.lines.reduce(
          (sum, line) => addMoney(sum, line.price!.amount),
          0,
        );
        total = checkout.money(amount, currencyById.get(payment.currencyId));
      }
      if (total) {
        exactCheckout.total = total;
      }
      if (payment?.provider) {
        exactCheckout.paymentProvider = payment.provider;
      }
      if (payment?.email) {
        exactCheckout.email = payment.email;
      }
      const distinct = distinctDeliveries(delivery);
      if (distinct.length) {
        exactCheckout.delivery = [
          ...(exactCheckout.delivery ?? []),
          ...distinct,
        ];
      }
      if (!exactCheckout.receipts?.length) {
        const receipts = await service.orderWork.publishedReceipts(
          subjectId,
          orderId,
        );
        if (receipts.length) {
          exactCheckout.receipts = receipts;
        }
      }
      if (Object.keys(exactCheckout).length) {
        order.checkout = exactCheckout;
      }
      const discussion = await this.discussion(subjectId, orderId);
      if (discussion) {
        order.discussion = discussion;
      }
    }
    return details;
  }

  private async covers(products: IProduct[]) {
    const urls = new Map<string, string>();
    const visible = products.filter(
      (product) => product.variant === "default" && product.slug,
    );
    if (!visible.length) {
      return urls;
    }
    const { ecommerce, fileStorage } = this.dependencies.service.modules;
    const query = inIds(
      "productId",
      visible.map((product) => product.id),
      { variant: "default" },
    );
    const links = await ecommerce.productsToFileStorageModuleFiles.find({
      params: {
        ...query.params,
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
    if (!links.length) {
      return urls;
    }
    const files = await fileStorage.file.publicMetadata(
      inIds(
        "id",
        links.map((link) => link.fileStorageModuleFileId),
      ),
    );
    const byId = new Map(files.map((file) => [file.id, file]));
    for (const link of links) {
      const file = byId.get(link.fileStorageModuleFileId);
      if (urls.has(link.productId) || !file?.mimeType?.startsWith("image/")) {
        continue;
      }
      if (file.file.startsWith("https://")) {
        urls.set(link.productId, file.file);
      } else if (file.file.startsWith("/") && !file.file.startsWith("//")) {
        urls.set(
          link.productId,
          `${NEXT_PUBLIC_API_SERVICE_URL}/public${file.file}`,
        );
      }
    }
    return urls;
  }

  private async discussion(subjectId: string, orderId: string) {
    const { service } = this.dependencies;
    const discussion = await service.customerWork.discussionForOrder({
      customerId: subjectId,
      orderId,
    });
    if (!discussion) {
      return;
    }
    const { chatId, threadId } = discussion;
    try {
      await service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId,
        socialModuleChatId: chatId,
      });
      await service.customerWork.assertChatAccess({
        subjectId,
        chatId,
        threadId,
        edit: false,
      });
    } catch (error) {
      const { status } = getHttpErrorType(error);
      if ([401, 403, 404].includes(status)) {
        return;
      }
      throw error;
    }
    return { chatId, threadId };
  }
}
