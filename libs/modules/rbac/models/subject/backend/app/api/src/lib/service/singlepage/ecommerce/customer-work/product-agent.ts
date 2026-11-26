import type { IFunnelDefinition } from "@sps/crm/models/funnel/sdk/model";
import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import type { Service as Subject } from "../../index";
import { criteria } from "./utils";

export class ProductAgent {
  constructor(private readonly subject: Subject) {}

  async paidStageEmployee(task: Task, definition?: IFunnelDefinition) {
    if (!task.orderId) {
      return;
    }
    const current =
      definition ??
      (
        await this.subject.modules.crm.task.getFunnel({
          storeId: task.storeId,
          taskId: task.id,
        })
      ).definition;
    const active = current.stages.filter((stage) => !stage.archived);
    const index = active.findIndex((stage) => stage.id === task.stageId);
    const paymentIndex = active.findIndex(
      (stage) => stage.behavior === "ecommerce-module-order-payment",
    );
    if (paymentIndex >= 0 && index >= paymentIndex) {
      return active[index]?.defaultAssigneeSubjectId;
    }
    return undefined;
  }

  async resolve(task: Task, definition?: IFunnelDefinition) {
    if (!task.productId && !task.offerId) {
      return undefined;
    }
    const { storeId } = task;
    const employees = this.subject.crmWorkspace.employees;
    const configured = await this.paidStageEmployee(task, definition);
    if (configured) {
      const [employee] = await employees.list(storeId, [configured]);
      return employee;
    }
    let productId = task.productId;
    if (!productId && task.offerId) {
      const offer =
        await this.subject.modules.ecommerce.storesToProducts.findById({
          id: task.offerId,
        });
      if (!offer || offer.storeId !== storeId) {
        return undefined;
      }
      productId = offer.productId;
    }
    if (productId) {
      const links =
        await this.subject.module.subjectsToEcommerceModuleProducts.find(
          criteria({
            ecommerceModuleProductId: productId,
            variant: "store-expert",
          }),
        );
      if (links.length) {
        const candidates = await employees.list(storeId, [
          ...new Set(links.map((link) => link.subjectId)),
        ]);
        return candidates.length === 1 ? candidates[0] : undefined;
      }
    }

    const stages =
      definition ??
      (
        await this.subject.modules.crm.task.getFunnel({
          storeId,
          taskId: task.id,
        })
      ).definition;
    const assigned = new Set<string>();
    for (const stage of stages.stages) {
      if (!stage.archived && stage.defaultAssigneeSubjectId) {
        assigned.add(stage.defaultAssigneeSubjectId);
      }
    }
    const candidates = await employees.list(storeId, [...assigned]);
    return candidates.length === 1 ? candidates[0] : undefined;
  }
}
