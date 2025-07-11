import { ISeedResult } from "@sps/shared-backend-api";
import { app as agentApp } from "@sps/agent/backend/app/api";
import { app as billingApp } from "@sps/billing/backend/app/api";
import { app as blogApp } from "@sps/blog/backend/app/api";
import { app as broadcastApp } from "@sps/broadcast/backend/app/api";
import { app as crmApp } from "@sps/crm/backend/app/api";
import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
import { app as fileStorageApp } from "@sps/file-storage/backend/app/api";
import { app as hostApp } from "@sps/host/backend/app/api";
import { app as notificationApp } from "@sps/notification/backend/app/api";
import { app as socialApp } from "@sps/social/backend/app/api";
import { app as rbacApp } from "@sps/rbac/backend/app/api";
import { app as startupApp } from "@sps/startup/backend/app/api";
import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";
import { app as telegramApp } from "@sps/telegram/backend/app/api";
import { logger } from "@sps/backend-utils";

import { exit } from "process";
import {
  API_SERVICE_URL,
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";

(async () => {
  const seeds: ISeedResult[] = [];
  const agentModelsSeeds = await agentApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(agentModelsSeeds)) {
    agentModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(agentModelsSeeds);
  }

  const telegramModelsSeeds = await telegramApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(telegramModelsSeeds)) {
    telegramModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(telegramModelsSeeds);
  }

  const broadcastModelsSeeds = await broadcastApp.seed({
    type: "model",
    seeds,
  });

  if (Array.isArray(broadcastModelsSeeds)) {
    broadcastModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(broadcastModelsSeeds);
  }

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

  const billingModelsSeeds = await billingApp.seed({
    type: "model",
    seeds,
  });
  if (Array.isArray(billingModelsSeeds)) {
    billingModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(billingModelsSeeds);
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

  const socialModelsSeeds = await socialApp.seed({
    type: "model",
    seeds,
  });
  if (Array.isArray(socialModelsSeeds)) {
    socialModelsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(socialModelsSeeds);
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

  const agentRelationsSeeds = await agentApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(agentRelationsSeeds)) {
    agentRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(agentRelationsSeeds);
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

  const telegramRelationsSeeds = await telegramApp.seed({
    type: "relation",
    seeds,
  });
  if (Array.isArray(telegramRelationsSeeds)) {
    telegramRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(telegramRelationsSeeds);
  }

  const broadcastRelationsSeeds = await broadcastApp.seed({
    type: "relation",
    seeds,
  });

  if (Array.isArray(broadcastRelationsSeeds)) {
    broadcastRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(broadcastRelationsSeeds);
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

  const billingRelationsSeeds = await billingApp.seed({
    type: "relation",
    seeds,
  });
  if (Array.isArray(billingRelationsSeeds)) {
    billingRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(billingRelationsSeeds);
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

  const socialRelationsSeeds = await socialApp.seed({
    type: "relation",
    seeds,
  });
  if (Array.isArray(socialRelationsSeeds)) {
    socialRelationsSeeds.forEach((seed) => {
      seeds.push(seed);
    });
  } else {
    seeds.push(socialRelationsSeeds);
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

  if (!RBAC_SECRET_KEY) {
    return;
  }

  await fetch(API_SERVICE_URL + "/api/http-cache/clear", {
    headers: {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
    },
  })
    .then((res) => {
      return res.json();
    })
    .catch((error) => {
      logger.error("🚀 ~ /api/http-cache/clear error:", error);
    });

  await fetch(HOST_SERVICE_URL + "/api/revalidate?path=/&type=layout", {
    headers: {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
    },
  })
    .then((res) => res.json())
    .catch((error) => {
      logger.error("🚀 ~ /api/revalidation/revalidate error:", error);
    });

  setTimeout(async () => {
    await fetch(HOST_SERVICE_URL)
      .then((res) => {
        return res.text();
      })
      .catch((error) => {
        logger.error("🚀 ~ HOST_SERVICE_URL error:", error);
      });
  }, 10000);
})()
  .then(() => {
    exit(0);
  })
  .catch((error) => {
    logger.error(error);
    exit(1);
  });
