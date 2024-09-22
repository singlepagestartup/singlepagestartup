import { ISeedResult } from "@sps/shared-backend-api";
import { app as hostApp } from "@sps/host/backend/app/api";
import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";
import { app as rbacApp } from "@sps/rbac/backend/app/api";
import { app as crmApp } from "@sps/crm/backend/app/api";
import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
import { app as notificationApp } from "@sps/notification/backend/app/api";
import { app as blogApp } from "@sps/blog/backend/app/api";
import { app as fileStorageApp } from "@sps/file-storage/backend/app/api";
import { app as startupApp } from "@sps/startup/backend/app/api";

import { exit } from "process";

(async () => {
  const seeds: ISeedResult[] = [];

  const hostModelsSeeds = await hostApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(hostModelsSeeds)) {
    hostModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(hostModelsSeeds);
  }

  const websiteBuilderModelsSeeds = await websiteBuilderApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(websiteBuilderModelsSeeds)) {
    websiteBuilderModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(websiteBuilderModelsSeeds);
  }

  const crmModelsSeeds = await crmApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(crmModelsSeeds)) {
    crmModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(crmModelsSeeds);
  }

  const blogModelsSeeds = await blogApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(blogModelsSeeds)) {
    blogModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(blogModelsSeeds);
  }

  const notificationModelsSeeds = await notificationApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(notificationModelsSeeds)) {
    notificationModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(notificationModelsSeeds);
  }

  const ecommerceModelsSeeds = await ecommerceApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(ecommerceModelsSeeds)) {
    ecommerceModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(ecommerceModelsSeeds);
  }

  const rbacModelsSeeds = await rbacApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(rbacModelsSeeds)) {
    rbacModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(rbacModelsSeeds);
  }

  const fileStorageModelsSeeds = await fileStorageApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(fileStorageModelsSeeds)) {
    fileStorageModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(fileStorageModelsSeeds);
  }

  const startupModelsSeeds = await startupApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(startupModelsSeeds)) {
    startupModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(startupModelsSeeds);
  }

  const hostRelationsSeeds = await hostApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(hostRelationsSeeds)) {
    hostRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(hostRelationsSeeds);
  }

  const websiteBuilderRelationsSeeds = await websiteBuilderApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(websiteBuilderRelationsSeeds)) {
    websiteBuilderRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(websiteBuilderRelationsSeeds);
  }

  const notificationRelationsSeeds = await notificationApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(notificationRelationsSeeds)) {
    notificationRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(notificationRelationsSeeds);
  }

  const blogRelationsSeeds = await blogApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(blogRelationsSeeds)) {
    blogRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(blogRelationsSeeds);
  }

  const crmRelationsSeeds = await crmApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(crmRelationsSeeds)) {
    crmRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(crmRelationsSeeds);
  }

  const ecommerceRelationsSeeds = await ecommerceApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(ecommerceRelationsSeeds)) {
    ecommerceRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(ecommerceRelationsSeeds);
  }

  const rbacRelationsSeeds = await rbacApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(rbacRelationsSeeds)) {
    rbacRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(rbacRelationsSeeds);
  }

  const fileStorageRelationsSeeds = await fileStorageApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(fileStorageRelationsSeeds)) {
    fileStorageRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(fileStorageRelationsSeeds);
  }

  const startupRelationsSeeds = await startupApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(startupRelationsSeeds)) {
    startupRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(startupRelationsSeeds);
  }
})()
  .then(() => {
    exit(0);
  })
  .catch((error) => {
    console.error(error);
    exit(1);
  });
