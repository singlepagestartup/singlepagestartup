export const userStory = {
  order: {
    update: {
      approving: {
        receipt: {
          variant: "order-receipt",
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
