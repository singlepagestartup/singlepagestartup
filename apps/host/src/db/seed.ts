import { ModuleSeeder as SpsWebsiteBuilderModuleSeeder } from "@sps/sps-website-builder-backend-app";
import { ModuleSeeder as StartupModuleSeeder } from "@sps/startup-backend-app";
import { ModuleSeeder as SpsFileStorageModuleSeeder } from "@sps/sps-file-storage-backend-app";
import { ModuleSeeder as SpsRbacModuleSeeder } from "@sps/sps-rbac-backend-app";
import { exit } from "process";

(async () => {
  const seedAll = process.env["SEED_ALL"] === "true";

  const seedResults = {};
  const seedConfig = {};

  const spsWebsiteBuilderModuleSeeder = new SpsWebsiteBuilderModuleSeeder({
    seedResults,
    seedConfig,
  });

  const spsFileStorageModuleSeeder = new SpsFileStorageModuleSeeder({
    seedResults,
    seedConfig,
  });

  const spsRbacModuleSeeder = new SpsRbacModuleSeeder({
    seedResults,
    seedConfig,
  });

  const startupModuleSeeder = new StartupModuleSeeder({
    seedResults,
    seedConfig,
  });

  if (spsWebsiteBuilderModuleSeeder.config.seed || seedAll) {
    await spsWebsiteBuilderModuleSeeder.seedModels();
  }
  if (spsFileStorageModuleSeeder.config.seed || seedAll) {
    await spsFileStorageModuleSeeder.seedModels();
  }
  if (spsRbacModuleSeeder.config.seed || seedAll) {
    await spsRbacModuleSeeder.seedModels();
  }
  if (startupModuleSeeder.config.seed || seedAll) {
    await startupModuleSeeder.seedModels();
  }

  if (spsWebsiteBuilderModuleSeeder.config.seed || seedAll) {
    await spsWebsiteBuilderModuleSeeder.seedRelations();
  }
  if (spsFileStorageModuleSeeder.config.seed || seedAll) {
    await spsFileStorageModuleSeeder.seedRelations();
  }
  if (spsRbacModuleSeeder.config.seed || seedAll) {
    await spsRbacModuleSeeder.seedRelations();
  }
  if (startupModuleSeeder.config.seed || seedAll) {
    await startupModuleSeeder.seedRelations();
  }
})()
  .then(() => {
    exit(0);
  })
  .catch((error) => {
    console.error(error);
    exit(1);
  });