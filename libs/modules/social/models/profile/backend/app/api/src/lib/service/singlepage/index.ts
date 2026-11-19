import { createModule } from "../module";
import { createModules } from "@sps/social/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/profile/backend/repository/database";
import { Service as Authors } from "../startup/authors";
import type {
  IAuthorFindParams,
  IAuthorFilters,
} from "@sps/social/models/profile/sdk/model";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  authorFind(params: IAuthorFindParams = {}) {
    return this.createAuthors().authorFind(params);
  }
  authorFindCount(params: IAuthorFilters = {}) {
    return this.createAuthors().authorFindCount(params);
  }
  authorFindById(props: { id: string }) {
    return this.createAuthors().authorFindById(props);
  }
  async profilePresentation(props: { id: string }) {
    const profile = await this.findById(props);
    if (!profile) {
      return null;
    }
    const presentation = await this.createAuthors().presentation(profile);
    // This service capability is used only after Chat access is established.
    // Preserve its existing display name without returning private field names.
    if (
      !Object.values(profile.title || {}).some(
        (value) => typeof value === "string" && value.trim(),
      )
    ) {
      const displayTitle = profile.adminTitle?.trim();
      if (displayTitle) {
        presentation.title = { en: displayTitle, ru: displayTitle };
      }
    }
    return presentation;
  }

  private createAuthors(): Authors {
    const { module, modules } = this;
    return new Authors({
      profile: this,
      get article() {
        return modules.blog.article;
      },
      get product() {
        return modules.ecommerce.product;
      },
      get file() {
        return modules.fileStorage.file;
      },
      get profilesToArticles() {
        return module.profilesToBlogModuleArticles;
      },
      get profilesToProducts() {
        return module.profilesToEcommerceModuleProducts;
      },
      get profilesToFiles() {
        return module.profilesToFileStorageModuleFiles;
      },
    });
  }
}
