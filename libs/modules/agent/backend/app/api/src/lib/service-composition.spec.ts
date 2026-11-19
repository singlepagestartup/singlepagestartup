import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

it("shares the owning Order across Agent and HTTP within each assembly", () => {
  const script = String.raw`
import assert from "node:assert/strict";
import { createAppAssembly, DefaultApp } from "@sps/shared-backend-api";

const init = DefaultApp.prototype.init;
const initAttempts = [];
const startupError = new Error("Order HTTP initialization failed");
let failNextInit = false;
DefaultApp.prototype.init = async function () {
  initAttempts.push(this);
  if (failNextInit) {
    failNextInit = false;
    throw startupError;
  }
  await init.call(this);
};

const {
  bootstrap: startAgent,
  createService: createAgent,
} = await import("@sps/agent/models/agent/backend/app/api/src/lib/bootstrap");
const {
  bootstrap: startOrder,
  createService: createOrder,
  createOrderBootstrap,
  orderBootstrap,
} = await import("@sps/ecommerce/models/order/backend/app/api/src/lib/bootstrap");
const { Service: Order } =
  await import("@sps/ecommerce/models/order/backend/app/api/src/lib/service/startup");
const { createService: createBillingPaymentIntent } =
  await import("@sps/billing/models/payment-intent/backend/app/api/src/lib/bootstrap");
const {
  bootstrap: startSubject,
  createService: createSubject,
} = await import("@sps/rbac/models/subject/backend/app/api/src/lib/bootstrap");
const { createService: createProduct, serviceBootstrap: productBootstrap } =
  await import("@sps/ecommerce/models/product/backend/app/api/src/lib/bootstrap");
const { serviceBootstrap: offerLinksOwner, createOfferLinksBootstrap } =
  await import("@sps/ecommerce/relations/offers-to-offers/backend/app/api/src/lib/bootstrap");
const { createService: createRolesLink } =
  await import("@sps/rbac/relations/subjects-to-roles/backend/app/api/src/lib/bootstrap");
const { serviceBootstrap: fileWidgetBootstrap } =
  await import("@sps/file-storage/models/widget/backend/app/api/src/lib/bootstrap");
const { Service: FileWidget } =
  await import("@sps/file-storage/models/widget/backend/app/api/src/lib/service/startup");
const { Repository: FileWidgetRepository } =
  await import("@sps/file-storage/models/widget/backend/app/api/src/lib/repository");
const { Configuration: FileWidgetConfiguration } =
  await import("@sps/file-storage/models/widget/backend/app/api/src/lib/configuration");

function assertAgentOrder(agent, order) {
  assert.equal(agent.modules.ecommerce.order, order);
  assert.ok(!("ecommerceModule" in agent));
  assert.ok(!("agent" in agent.modules));
}

function assertSubjectOrder(subject, order, assembly) {
  assert.equal(subject.modules.ecommerce.order, order);
  assert.ok(!("billingModule" in subject));
  assert.ok(!("rbac" in subject.modules));
  assert.equal(subject.module.subjectsToRoles, createRolesLink(assembly));
  assert.equal(order.module.product, createProduct(assembly));
  assert.ok(!("order" in order.module));
  assert.ok(!("order" in order.module.product.module));
  assert.ok(!("ecommerce" in order.modules));
  assert.equal(subject.modules.billing.paymentIntent, createBillingPaymentIntent(assembly));
  assert.notEqual(subject.modules.billing.paymentIntent, order.paymentIntent);
  assert.equal(
    subject.ecommerceCatalog.dependencies.stock,
    order.ordersToBillingModulePaymentIntents,
  );
}

const agent = createAgent();
const order = agent.modules.ecommerce.order;
assert.ok(order instanceof Order);
assertAgentOrder(agent, createOrder());
assertSubjectOrder(createSubject(), order);
assert.equal(initAttempts.length, 0, "Direct service access started HTTP");

const [first, second] = await Promise.all([startOrder(), startOrder()]);
assert.equal(second.app, first.app);
assert.equal(first.service, order);
assert.equal(first.app.controller.service, order);
assert.equal(initAttempts.length, 1);
assert.equal(initAttempts[0], first.app);

const httpFirstAssembly = createAppAssembly();
const httpFirst = await startOrder(httpFirstAssembly);
const laterAgent = await startAgent(httpFirstAssembly);
assertAgentOrder(laterAgent.service, httpFirst.app.controller.service);
assert.equal(laterAgent.app.controller.service, createAgent(httpFirstAssembly));
assert.notEqual(httpFirst.service, order);

const retryAssembly = createAppAssembly();
const retryAgent = createAgent(retryAssembly);
const retryOrder = retryAgent.modules.ecommerce.order;
const attemptsBeforeRetry = initAttempts.length;
failNextInit = true;
await Promise.all([
  assert.rejects(startOrder(retryAssembly), (error) => error === startupError),
  assert.rejects(startOrder(retryAssembly), (error) => error === startupError),
]);
assert.equal(initAttempts.length, attemptsBeforeRetry + 1);
assert.equal(initAttempts.at(-1).controller.service, retryOrder);
const retry = await startOrder(retryAssembly);
assert.equal(initAttempts.length, attemptsBeforeRetry + 2);
assert.equal(retry.service, retryOrder);
assert.equal(retry.app.controller.service, retryOrder);
assertAgentOrder(retryAgent, retryOrder);

const collaborators = createOrder(createAppAssembly());
const reservations = collaborators.ordersToBillingModulePaymentIntents;
const payment = collaborators.paymentIntent;
let productReplacement;
const paymentRecord = { id: "assembly-payment", status: "succeeded" };
payment.findById = async ({ id }) => {
  assert.equal(id, paymentRecord.id);
  return paymentRecord;
};
const specializedOrder = createOrderBootstrap(reservations, payment);
const alternateOrder = createOrderBootstrap();
let specializedCreations = 0;
let fileWidgetCreations = 0;
const leftAssembly = createAppAssembly(({ overrideServiceWith }) => {
  overrideServiceWith(productBootstrap, (assembly) => {
    productReplacement = collaborators.module.product.withAppAssembly(assembly);
    return productReplacement;
  });
  overrideServiceWith(orderBootstrap, (assembly) => {
    specializedCreations += 1;
    return specializedOrder.createService(assembly);
  });
  overrideServiceWith(fileWidgetBootstrap, () => {
    fileWidgetCreations += 1;
    return new FileWidget(new FileWidgetRepository(new FileWidgetConfiguration()));
  });
});
const offerReader = { find: async () => [{ id: "visible-offer" }] };
const customOfferLinks = createOfferLinksBootstrap(() => offerReader);
const rightAssembly = createAppAssembly(({ overrideServiceWith }) => {
  overrideServiceWith(offerLinksOwner, (assembly) => customOfferLinks.createService(assembly));
  overrideServiceWith(orderBootstrap, (assembly) =>
    alternateOrder.createService(assembly),
  );
});
const [leftHttp, rightAgent] = await Promise.all([
  startOrder(leftAssembly),
  startAgent(rightAssembly),
]);
const leftOrder = leftHttp.service;
const rightOrder = rightAgent.service.modules.ecommerce.order;
const [leftAgent, rightHttp] = await Promise.all([
  startAgent(leftAssembly),
  startOrder(rightAssembly),
]);
const leftSubject = await startSubject(leftAssembly);
assert.notEqual(leftOrder, rightOrder);
assert.equal(specializedCreations, 1);
assert.equal(leftOrder.ordersToBillingModulePaymentIntents, reservations);
assert.equal(leftOrder.paymentIntent, payment);
assert.equal(leftOrder.module.product, productReplacement);
assert.notEqual(rightOrder.module.product, productReplacement);
assert.equal(
  await leftSubject.app.controller.service.ecommerceModuleOrderPaymentCheck.execute(paymentRecord.id),
  paymentRecord,
);
assertAgentOrder(leftAgent.service, leftOrder);
assertAgentOrder(rightAgent.service, rightOrder);
assert.equal(leftSubject.app.controller.service, leftSubject.service);
assertSubjectOrder(leftSubject.service, leftOrder, leftAssembly);
assertSubjectOrder(createSubject(rightAssembly), rightOrder, rightAssembly);
assert.equal(leftHttp.app.controller.service, leftOrder);
assert.equal(rightHttp.app.controller.service, rightOrder);
const links = rightAgent.service.modules.ecommerce.offersToOffers;
assert.equal(links, (await offerLinksOwner.bootstrap(rightAssembly)).app.controller.service);
assert.equal(links.offers, offerReader);
assert.deepEqual(await links.offers.find(), [{ id: "visible-offer" }]);
assert.notEqual(leftAgent.service.modules.ecommerce.offersToOffers.offers, offerReader);
assert.equal(createOrder(), order);
assertAgentOrder(createAgent(), order);

assert.equal(fileWidgetCreations, 0, "Order access constructed an unrelated service");
const fileWidget = leftAgent.service.modules.fileStorage.widget;
assert.equal(fileWidget, leftAgent.service.modules.fileStorage.widget);
assert.equal(fileWidgetCreations, 1);
`;

  const root = process.cwd();
  const result = spawnSync(
    resolve(root, "node_modules/.bin/bun"),
    [
      "--tsconfig-override",
      "tsconfig.base.json",
      "--no-env-file",
      "--eval",
      script,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        NODE_ENV: "test",
        DATABASE_HOST: "127.0.0.1",
        DATABASE_USERNAME: "sps_composition_test",
        DATABASE_PASSWORD: "sps_composition_test",
      },
      timeout: 15_000,
    },
  );
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      result.stderr ||
        result.stdout ||
        `Bun exited with ${result.signal ?? result.status}`,
    );
  }
});
