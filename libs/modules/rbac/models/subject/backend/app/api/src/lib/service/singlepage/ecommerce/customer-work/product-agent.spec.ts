import type { IModel as Task } from "@sps/crm/models/task/sdk/model";
import type { IFunnelDefinition } from "@sps/crm/models/funnel/sdk/model";
import { ProductAgent } from "./product-agent";
import type { Service as Subject } from "../../index";

const task = {
  id: "task",
  storeId: "store",
  productId: "product",
  offerId: "offer",
} as Task;
const alice = { id: "alice", profileId: "alice-profile", name: "Alice" };
const other = { id: "other", profileId: "other-profile", name: "Other" };

function fixture() {
  const find = jest.fn().mockResolvedValue([]);
  const list = jest.fn().mockResolvedValue([]);
  const findOffer = jest.fn();
  const subject = {
    modules: { ecommerce: { storesToProducts: { findById: findOffer } } },
    module: { subjectsToEcommerceModuleProducts: { find } },
    crmWorkspace: { employees: { list } },
  } as unknown as Subject;
  return { find, list, findOffer, agent: new ProductAgent(subject) };
}

const definition: IFunnelDefinition = {
  initialStageId: "stage-0",
  stages: ["alice", "alice", "other"].map(
    (defaultAssigneeSubjectId, index) => ({
      id: `stage-${index}`,
      name: "Review",
      instruction: "",
      actions: [],
      defaultAssigneeSubjectId,
      archived: index === 2,
    }),
  ),
};

it("uses the subject assigned to the product within the task store", async () => {
  const { agent, find, list } = fixture();
  find.mockResolvedValue([{ subjectId: other.id }]);
  list.mockResolvedValue([other]);
  await expect(agent.resolve(task, definition)).resolves.toEqual(other);
  expect(find).toHaveBeenCalledWith({
    params: {
      filters: {
        and: [
          {
            column: "ecommerceModuleProductId",
            method: "eq",
            value: "product",
          },
          { column: "variant", method: "eq", value: "store-expert" },
        ],
      },
    },
  });
  expect(list).toHaveBeenCalledWith("store", ["other"]);
});

it("finds the product through an offer and checks store ownership", async () => {
  const { agent, findOffer, find, list } = fixture();
  findOffer.mockResolvedValueOnce({
    storeId: "another-store",
    productId: "product",
  });
  const offerTask = { ...task, productId: null };
  await expect(agent.resolve(offerTask, definition)).resolves.toBeUndefined();
  expect(find).not.toHaveBeenCalled();
  findOffer.mockResolvedValue({ storeId: "store", productId: "product" });
  find.mockResolvedValue([{ subjectId: alice.id }]);
  list.mockResolvedValue([alice]);
  await expect(agent.resolve(offerTask, definition)).resolves.toEqual(alice);
});

it("uses the sole employee on active stages for a product without an assigned subject", async () => {
  const { agent, list } = fixture();
  list.mockResolvedValue([alice]);
  await expect(agent.resolve(task, definition)).resolves.toEqual(alice);
  expect(list).toHaveBeenCalledWith("store", ["alice"]);
});

it("keeps an ambiguous or ineligible explicit assignment available to the manager", async () => {
  const { agent, find, list } = fixture();
  find.mockResolvedValue([{ subjectId: alice.id }, { subjectId: other.id }]);
  list.mockResolvedValueOnce([alice, other]).mockResolvedValueOnce([]);
  await expect(agent.resolve(task, definition)).resolves.toBeUndefined();
  await expect(agent.resolve(task, definition)).resolves.toBeUndefined();
});

it("cannot choose between two active stage employees without a product expert", async () => {
  const { agent, list } = fixture();
  list.mockResolvedValue([alice, other]);
  await expect(
    agent.resolve(task, {
      ...definition,
      stages: definition.stages.map((stage) => ({ ...stage, archived: false })),
    }),
  ).resolves.toBeUndefined();
  expect(list).toHaveBeenCalledWith("store", ["alice", "other"]);
});
