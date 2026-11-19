export const OrderDI = {
  IFindByIdCheckoutAttributesService: Symbol.for(
    "ecommerce.order.find-by-id-checkout-attributes.service",
  ),
  IFindByIdTotalService: Symbol.for("ecommerce.order.find-by-id-total.service"),
  IFindByIdQuantityService: Symbol.for(
    "ecommerce.order.find-by-id-quantity.service",
  ),
  IOrdersToBillingModulePaymentIntentsService: Symbol.for(
    "ecommerce.order.orders-to-billing-module-payment-intents.service",
  ),
  IPaymentIntentService: Symbol.for("ecommerce.order.payment-intent.service"),
};
