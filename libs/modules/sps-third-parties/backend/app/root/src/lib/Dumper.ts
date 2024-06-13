import { models } from "@sps/sps-third-parties-backend-models";

export class Dumper {
  models: typeof models;
  name = "spsThirdParties";

  constructor() {
    this.models = models;
  }

  async dumpModels() {
    for (const [modelName, model] of Object.entries(this.models)) {
      if ("type" in model) {
        if ("dump" in model.services) {
          await model.services.dump();
        }
      }
    }
  }
}
