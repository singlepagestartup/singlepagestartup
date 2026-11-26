import { getHttpErrorType } from "@sps/backend-utils";
import type { IModel as IPaymentLink } from "@sps/ecommerce/relations/orders-to-billing-module-payment-intents/sdk/model";
import type { ISubjectCustomerOrderDetails } from "@sps/rbac/models/subject/sdk/model";
import type { SubjectServiceDependencies } from "../../index";
import { inIds } from "../customer-work/utils";

export interface IExecuteProps {
  subjectId: string;
  ownedHistoryOrderIds: string[];
  requestedOrderId?: string;
}

interface IConstructorProps {
  service: SubjectServiceDependencies<
    "customerWork" | "socialModuleChatLifecycleAssertSubjectOwnsChat"
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
    const { ecommerce } = this.dependencies.service.modules;
    const [lines, payments, states] = await Promise.all([
      ecommerce.ordersToProducts.find(inIds("orderId", ownedHistoryOrderIds)),
      ecommerce.ordersToBillingModulePaymentIntents.find({
        params: {
          ...inIds("orderId", ownedHistoryOrderIds, {
            reservationStatus: "consumed",
          }).params,
          orderBy: {
            and: [
              { column: "createdAt", method: "desc" },
              { column: "id", method: "desc" },
            ],
          },
        },
      }),
      ecommerce.order.work.statesForCustomer(subjectId, ownedHistoryOrderIds),
    ]);
    for (const { orderId, state } of states) {
      const order = details.get(orderId);
      if (order) {
        order.workState = state;
      }
    }
    const savedByLine = new Map<string, IPaymentLink>();
    for (const payment of payments) {
      if (
        payment.orderLineId &&
        payment.purchaseSnapshot &&
        !savedByLine.has(payment.orderLineId)
      ) {
        savedByLine.set(payment.orderLineId, payment);
      }
    }
    const products = lines.length
      ? await ecommerce.product.find(
          inIds(
            "id",
            lines.map((line) => line.productId),
          ),
        )
      : [];
    const titles = new Map(
      products.map((product) => [product.id, product.title]),
    );
    for (const line of lines) {
      const order = details.get(line.orderId);
      if (!order) {
        continue;
      }
      const saved = savedByLine.get(line.id);
      const charge = saved?.purchaseSnapshot?.charge;
      const matches =
        saved?.orderId === line.orderId && charge?.productId === line.productId;
      const savedTitle = matches ? charge?.title : undefined;
      let title = titles.get(line.productId) ?? {};
      // Checkout saved a single title without a language tag.
      if (
        savedTitle &&
        savedTitle !== line.productId &&
        !Object.values(title).includes(savedTitle)
      ) {
        title = { und: savedTitle };
      }
      order.lines.push({
        id: line.id,
        productId: line.productId,
        title,
        quantity: matches && charge ? charge.quantity : line.quantity,
      });
    }
    if (requestedOrderId && details.has(requestedOrderId)) {
      const discussion = await this.discussion(subjectId, requestedOrderId);
      if (discussion) {
        details.get(requestedOrderId)!.discussion = discussion;
      }
    }
    return details;
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
