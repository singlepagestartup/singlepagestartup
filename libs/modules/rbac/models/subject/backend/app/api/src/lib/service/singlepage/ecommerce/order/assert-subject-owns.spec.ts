/**
 * BDD Suite: subject ownership of an ecommerce order.
 *
 * Given: a subject asks for an order by id.
 * When: the ownership assertion runs against the subject-to-order relation.
 * Then: it passes only when a relation row links that subject to that order.
 */

import {
  Service,
  SUBJECT_DOES_NOT_OWN_ORDER_ERROR,
} from "./assert-subject-owns";

const SUBJECT_ID = "subject-1";
const ORDER_ID = "order-1";

function createTestContext(props?: { relations?: unknown[] }) {
  const find = jest.fn().mockResolvedValue(props?.relations ?? []);

  return {
    find,
    service: new Service({
      subjectsToEcommerceModuleOrders: { find } as any,
    }),
  };
}

describe("Given: a subject and an ecommerce order", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario: the relation exists.
   *
   * Given: a relation row links the subject to the order.
   * When: the assertion runs.
   * Then: it resolves and the relation was queried on both columns.
   */
  it("When: a relation links the subject to the order Then: the assertion passes", async () => {
    const { find, service } = createTestContext({
      relations: [{ subjectId: SUBJECT_ID, ecommerceModuleOrderId: ORDER_ID }],
    });

    await expect(
      service.execute({
        subjectId: SUBJECT_ID,
        ecommerceModuleOrderId: ORDER_ID,
      }),
    ).resolves.toBeUndefined();

    expect(find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: SUBJECT_ID,
            },
            {
              column: "ecommerceModuleOrderId",
              method: "eq",
              value: ORDER_ID,
            },
          ],
        },
      },
    });
  });

  /**
   * BDD Scenario: the order belongs to someone else.
   *
   * Given: no relation row links the subject to the order.
   * When: the assertion runs.
   * Then: it rejects with the permission error.
   */
  it("When: no relation links the subject to the order Then: the assertion rejects with a permission error", async () => {
    const { service } = createTestContext();

    await expect(
      service.execute({
        subjectId: SUBJECT_ID,
        ecommerceModuleOrderId: ORDER_ID,
      }),
    ).rejects.toThrow(SUBJECT_DOES_NOT_OWN_ORDER_ERROR);
  });
});
