/**
 * seeder service
 */

import { factories } from "@strapi/strapi";
const fs = require("fs/promises");
const path = require("path");

export default factories.createCoreService(
  "plugin::sps-migrate.seeder",
  ({ strapi }) => ({
    async run() {
      console.log("Seeding is started");

      const seededUids = {};

      // const allowedContentTypes: any = [
      //   // "plugin::sps-website-builder.page",
      //   "plugin::sps-website-builder.layout",
      //   "plugin::sps-website-builder.slide-over",
      //   // "plugin::sps-website-builder.flyout",
      //   // "plugin::sps-crm.form",
      // ];

      const notAllowedContentTypes: any = [
        "admin::api-token",
        "admin::api-token-permission",
        "admin::permission",
        "admin::role",
        "admin::transfer-token",
        "admin::transfer-token-permission",
        "admin::user",
        "plugin::upload.file",
        "plugin::upload.folder",
        "plugin::users-permissions.permission",
        "plugin::users-permissions.role",
        "plugin::users-permissions.user",
        "plugin::content-releases.release",
        "plugin::content-releases.release-action",
      ];

      for (const contentType of Object.keys(strapi.contentTypes)) {
        if (notAllowedContentTypes.includes(contentType)) {
          continue;
        }

        try {
          await strapi.service("plugin::sps-migrate.entity").seed({
            uid: contentType,
            seededUids,
          });
        } catch (error) {
          console.log("🚀 ~ run ~ error:", error);
        }
      }

      for (const contentType of Object.keys(strapi.contentTypes)) {
        if (notAllowedContentTypes.includes(contentType)) {
          continue;
        }

        try {
          await strapi.service("plugin::sps-migrate.entity").seedRelations({
            uid: contentType,
            seededUids,
          });
        } catch (error) {
          console.log("🚀 ~ run ~ error:", error);
        }
      }

      console.log("Seeding is finished");
    },

    splitUid({ uid }: { uid: string }) {
      const type = uid.split("::")[0];
      const modelDirName = uid.split("::")[1].split(".")[0];
      const entityName = uid.split("::")[1].split(".")[1];
      let dirPath;
      if (type === "plugin") {
        dirPath = path.join(strapi.dirs.app.extensions);
      } else if (type === "api") {
        dirPath = path.join(strapi.dirs.app.api);
      } else {
        dirPath = path.join(strapi.dirs.app.root);
      }

      let modelName = modelDirName;
      if (uid === "plugin-i18n") {
        modelName = "i18n";
      }

      return { type, modelDirName, modelName, entityName, dirPath };
    },

    getSchema({ uid }: { uid: string }) {
      let schema = strapi.contentTypes[uid]?.["__schema__"];

      if (!schema) {
        schema = strapi.components[uid]["__schema__"];
      }

      return schema;
    },

    async getSeedsFolder({ uid }: { uid: string }) {
      const { dirPath } = strapi
        .service("plugin::sps-migrate.seeder")
        .splitUid({ uid });
      const { modelDirName, entityName } = strapi
        .service("plugin::sps-migrate.seeder")
        .splitUid({ uid });

      const pathToSeedsFolder = path.join(
        dirPath,
        `/${modelDirName}/content-types${
          entityName ? `/${entityName}` : ""
        }/seeds`,
      );

      let seedFiles;
      try {
        seedFiles = await fs.readdir(pathToSeedsFolder);
      } catch (error) {
        return;
      }

      seedFiles = seedFiles
        .filter((s) => {
          return s.includes(".json");
        })
        .map((s) => {
          return `${pathToSeedsFolder}/${s}`;
        });

      return { seedFiles, pathToSeedsFolder };
    },

    async getSeeds({ uid }: { uid: string }) {
      const seedFolder = await strapi
        .service("plugin::sps-migrate.seeder")
        .getSeedsFolder({ uid });

      if (!seedFolder) {
        return;
      }

      const { seedFiles } = seedFolder;

      const seeds: any[] = [];

      if (!seedFiles?.length || !seedFiles?.length) {
        return seeds;
      }

      const schema = strapi
        .service("plugin::sps-migrate.seeder")
        .getSchema({ uid });

      if (schema.kind === "singleType" && seedFiles.length > 1) {
        throw new Error("Single Type entity can't has more than one entity");
      }

      for (const seedFile of seedFiles) {
        const readedSeedFile = await fs
          .readFile(seedFile, "utf8")
          .catch((error) => {
            // console.log(`🚀 ~ seed ~ error`, error);
          });

        seeds.push(JSON.parse(readedSeedFile));
      }

      return seeds;
    },
  }),
);
