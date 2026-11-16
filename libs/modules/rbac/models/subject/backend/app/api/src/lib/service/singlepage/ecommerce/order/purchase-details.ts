import type {
  IModel as IEcommerceModuleOrder,
  IPurchaseDetails,
} from "@sps/ecommerce/models/order/sdk/model";
import type { Service as SubjectService } from "../../index";

export interface IExecuteProps {
  subjectId: string;
  orders: IEcommerceModuleOrder[];
}

interface IConstructorProps {
  service: Pick<
    SubjectService,
    | "ecommerceModuleOrderPurchasePayments"
    | "ecommerceModule"
    | "fileStorageModule"
  >;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute({ subjectId, orders }: IExecuteProps) {
    const { service } = this.dependencies;
    const { retryableIds, paymentUrls } =
      await service.ecommerceModuleOrderPurchasePayments({
        subjectId,
        orders,
      });
    const receiptOrderIds = orders
      .filter((order) => !retryableIds.has(order.id))
      .map((order) => order.id);
    let receiptLinks: {
      orderId: string;
      fileStorageModuleFileId: string;
    }[] = [];
    if (receiptOrderIds.length) {
      receiptLinks =
        await service.ecommerceModule.ordersToFileStorageModuleFiles.find({
          params: {
            filters: {
              and: [
                {
                  column: "orderId",
                  method: "inArray",
                  value: receiptOrderIds,
                },
                {
                  column: "variant",
                  method: "eq",
                  value: "receipt-default",
                },
              ],
            },
          },
        });
    }
    const linksByOrder = Map.groupBy(receiptLinks, (link) => link.orderId);
    const receiptIds = [
      ...new Set(receiptLinks.map((link) => link.fileStorageModuleFileId)),
    ];
    const filesById = new Map<string, IPurchaseDetails["receipts"][number]>();
    if (receiptIds.length) {
      const files: IPurchaseDetails["receipts"] =
        await service.fileStorageModule.file.find({
          params: {
            filters: {
              and: [{ column: "id", method: "inArray", value: receiptIds }],
            },
          },
        });
      for (const file of files) {
        if (file.file?.trim()) {
          filesById.set(file.id, file);
        }
      }
    }
    const purchases: (IEcommerceModuleOrder & {
      purchaseDetails: IPurchaseDetails;
    })[] = [];
    for (const order of orders) {
      const totals = await service.ecommerceModule.order.findByIdTotal({
        id: order.id,
      });
      const receipts = (linksByOrder.get(order.id) ?? []).flatMap(
        (link) => filesById.get(link.fileStorageModuleFileId) ?? [],
      );
      purchases.push({
        ...order,
        purchaseDetails: {
          canRepeatPayment: retryableIds.has(order.id),
          paymentUrl: paymentUrls.get(order.id),
          totals: totals.totals,
          receipts,
          ...(totals.unpriced.length ? { unpriced: totals.unpriced } : {}),
        },
      });
    }
    return purchases;
  }
}
