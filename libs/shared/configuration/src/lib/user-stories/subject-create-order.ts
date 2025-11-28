export const userStory = {
  order: {
    update: {
      approving: {
        receipt: {
          variant: "generate-template-ecommerce-order-receipt-default",
          width: 1500,
          height: 1500,
        },
      },
    },
  },
  afterInvoiceCreated: {
    notification: {
      template: {
        variant: "order-status-changed",
      },
    },
  },
};
