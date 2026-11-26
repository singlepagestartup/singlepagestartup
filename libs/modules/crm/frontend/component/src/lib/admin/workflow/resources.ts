export const workflowResources = [
  "funnel",
  "stage",
  "task",
  "funnels-to-stages",
  "funnels-to-tasks",
  "tasks-to-stages",
  "funnels-to-ecommerce-module-stores-to-products",
  "tasks-to-ecommerce-module-stores-to-products",
  "tasks-to-ecommerce-module-orders",
] as const;

export type WorkflowResource = (typeof workflowResources)[number];
