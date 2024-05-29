import { IModuleSeedConfig } from "@sps/shared-backend-api";
import { models } from "@sps/sps-file-storage-backend-models";

export const config: IModuleSeedConfig<typeof models> = {
  seed: process.env["SPS_FILE_STORAGE_SEED"] === "true",
  models: [{ name: "file" }, { name: "widget" }],
};
