/**
 * BDD Suite: finding the open cart order that already holds a product.
 *
 * Given: a subject whose orders may be open carts, checked-out history or cancelled carts.
 * When: the add-to-cart flow asks whether a product is already in the cart.
 * Then: the blocking order is reported, and the lookups stay narrowed to that subject's own orders.
 */

import { Service } from "./find-open-cart-order-with-product";

const SUBJECT_ID = "subject-1";
const PRODUCT_ID = "product-1";
const OPEN_CART_ORDER_ID = "order-open";

type IOrder = {
  id: string;
  type: string;
  status: string;
};

type IOrderToProduct = {
  orderId: string;
  productId: string;
};

function createTestContext(props?: {
  subjectOrderIds?: string[];
  openCartOrders?: IOrder[];
  ordersToProducts?: IOrderToProduct[];
}) {
  const subjectOrderIds = props?.subjectOrderIds ?? [OPEN_CART_ORDER_ID];
  const openCartOrders = props?.openCartOrders ?? [
    { id: OPEN_CART_ORDER_ID, type: "cart", status: "new" },
  ];
  const ordersToProducts = props?.ordersToProducts ?? [
    { orderId: OPEN_CART_ORDER_ID, productId: PRODUCT_ID },
  ];

  const subjectsToEcommerceModuleOrders = {
    find: jest.fn().mockResolvedValue(
      subjectOrderIds.map((ecommerceModuleOrderId) => ({
        subjectId: SUBJECT_ID,
        ecommerceModuleOrderId,
      })),
    ),
  } as any;

  const ecommerceModule = {
    order: {
      find: jest.fn().mockResolvedValue(openCartOrders),
    },
    ordersToProducts: {
      find: jest.fn().mockResolvedValue(ordersToProducts),
    },
  } as any;

  return {
    ecommerceModule,
    subjectsToEcommerceModuleOrders,
    service: new Service({ ecommerceModule, subjectsToEcommerceModuleOrders }),
  };
}

describe("Given: a subject and a product the add-to-cart flow is about to write", () => {
  /**
   * BDD Scenario: the product already sits in an open cart.
   *
   * Given: the subject has an open cart order holding the product.
   * When: the service runs.
   * Then: it answers with that order's id.
   */
  it("When: an open cart holds the product Then: that order id is returned", async () => {
    const { service } = createTestContext();

    await expect(
      service.execute({ subjectId: SUBJECT_ID, productId: PRODUCT_ID }),
    ).resolves.toBe(OPEN_CART_ORDER_ID);
  });

  /**
   * BDD Scenario: a subject with no orders cannot hold a duplicate.
   *
   * Given: the subject has no order links at all.
   * When: the service runs.
   * Then: it answers null without reading orders or order lines.
   */
  it("When: the subject has no orders Then: null is returned and no order lookup follows", async () => {
    const { service, ecommerceModule } = createTestContext({
      subjectOrderIds: [],
    });

    await expect(
      service.execute({ subjectId: SUBJECT_ID, productId: PRODUCT_ID }),
    ).resolves.toBeNull();

    expect(ecommerceModule.order.find).not.toHaveBeenCalled();
    expect(ecommerceModule.ordersToProducts.find).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: checked-out and cancelled orders are not open carts.
   *
   * Given: the subject's orders are all outside the open-cart filter.
   * When: the service runs.
   * Then: it answers null without asking which products those orders hold.
   */
  it("When: no order is an open cart Then: null is returned and no order line lookup follows", async () => {
    const { service, ecommerceModule } = createTestContext({
      subjectOrderIds: ["order-paid", "order-canceled"],
      openCartOrders: [],
    });

    await expect(
      service.execute({ subjectId: SUBJECT_ID, productId: PRODUCT_ID }),
    ).resolves.toBeNull();

    expect(ecommerceModule.ordersToProducts.find).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: an occupied cart does not block a different product.
   *
   * Given: the subject has an open cart that does not hold the requested product.
   * When: the service runs.
   * Then: it answers null.
   */
  it("When: the open cart does not hold the product Then: null is returned", async () => {
    const { service } = createTestContext({ ordersToProducts: [] });

    await expect(
      service.execute({ subjectId: SUBJECT_ID, productId: PRODUCT_ID }),
    ).resolves.toBeNull();
  });

  /**
   * BDD Scenario: the order lookup uses the same key every cart read uses.
   *
   * Given: the subject has order links.
   * When: the service runs.
   * Then: orders are read by the subject's own order ids, type cart and status new.
   */
  it("When: the service runs Then: orders are filtered by the subject's ids, cart type and new status", async () => {
    const { service, ecommerceModule, subjectsToEcommerceModuleOrders } =
      createTestContext();

    await service.execute({ subjectId: SUBJECT_ID, productId: PRODUCT_ID });

    expect(subjectsToEcommerceModuleOrders.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: SUBJECT_ID }],
        },
      },
    });
    expect(ecommerceModule.order.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: [OPEN_CART_ORDER_ID],
            },
            { column: "type", method: "eq", value: "cart" },
            { column: "status", method: "eq", value: "new" },
          ],
        },
      },
    });
  });

  /**
   * BDD Scenario: the order line lookup stays inside the subject's open carts.
   *
   * Given: the subject has open cart orders.
   * When: the service runs.
   * Then: order lines are read by those order ids and the product, never by the product alone.
   */
  it("When: the service runs Then: order lines are narrowed to the open cart orders and the product", async () => {
    const { service, ecommerceModule } = createTestContext({
      subjectOrderIds: [OPEN_CART_ORDER_ID, "order-second"],
      openCartOrders: [
        { id: OPEN_CART_ORDER_ID, type: "cart", status: "new" },
        { id: "order-second", type: "cart", status: "new" },
      ],
    });

    await service.execute({ subjectId: SUBJECT_ID, productId: PRODUCT_ID });

    expect(ecommerceModule.ordersToProducts.find).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: [OPEN_CART_ORDER_ID, "order-second"],
            },
            { column: "productId", method: "eq", value: PRODUCT_ID },
          ],
        },
      },
    });
  });
});
