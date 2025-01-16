import { app as agentApp } from "@sps/agent/backend/app/api";
import { app as hostApp } from "@sps/host/backend/app/api";
import { app as websiteBuilderApp } from "@sps/website-builder/backend/app/api";
import { app as rbacApp } from "@sps/rbac/backend/app/api";
import { app as crmApp } from "@sps/crm/backend/app/api";
import { app as billingApp } from "@sps/billing/backend/app/api";
import { app as ecommerceApp } from "@sps/ecommerce/backend/app/api";
import { app as notificationApp } from "@sps/notification/backend/app/api";
import { app as blogApp } from "@sps/blog/backend/app/api";
import { app as fileStorageApp } from "@sps/file-storage/backend/app/api";
import { app as startupApp } from "@sps/startup/backend/app/api";

import { exit } from "process";

(async () => {
  await fileStorageApp.dump({
    type: "model",
    dumps: [],
  });

  await websiteBuilderApp.dump({
    type: "model",
    dumps: [],
  });

  await crmApp.dump({
    type: "model",
    dumps: [],
  });

  await blogApp.dump({
    type: "model",
    dumps: [],
  });

  await billingApp.dump({
    type: "model",
    dumps: [],
  });

  await ecommerceApp.dump({
    type: "model",
    dumps: [],
  });

  await notificationApp.dump({
    type: "model",
    dumps: [],
  });

  await startupApp.dump({
    type: "model",
    dumps: [],
  });

  await rbacApp.dump({
    type: "model",
    dumps: [],
  });

  await hostApp.dump({
    type: "model",
    dumps: [],
  });

  await agentApp.dump({
    type: "model",
    dumps: [],
  });

  await fileStorageApp.dump({
    type: "relation",
    dumps: [],
  });

  await websiteBuilderApp.dump({
    type: "relation",
    dumps: [],
  });

  await crmApp.dump({
    type: "relation",
    dumps: [],
  });

  await blogApp.dump({
    type: "relation",
    dumps: [],
  });

  await billingApp.dump({
    type: "relation",
    dumps: [],
  });

  await ecommerceApp.dump({
    type: "relation",
    dumps: [],
  });

  await notificationApp.dump({
    type: "relation",
    dumps: [],
  });

  await startupApp.dump({
    type: "relation",
    dumps: [],
  });

  await rbacApp.dump({
    type: "relation",
    dumps: [],
  });

  await hostApp.dump({
    type: "relation",
    dumps: [],
  });

  await agentApp.dump({
    type: "relation",
    dumps: [],
  });
})()
  .then(() => {
    exit(0);
  })
  .catch((error) => {
    console.error(error);
    exit(1);
  });
