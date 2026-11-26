import { createModule } from "../module";
import { createModules } from "@sps/social/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/relations/profiles-to-skills/backend/repository/database";

@injectable()
@injectFromBase()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  async linkedSkills(profileId: string, ids?: string[]) {
    if (ids && !ids.length) {
      return [];
    }
    const links = await this.find({
      params: {
        filters: {
          and: [
            { column: "profileId", method: "eq", value: profileId },
            { column: "variant", method: "eq", value: "default" },
            ...(ids
              ? [{ column: "skillId", method: "inArray" as const, value: ids }]
              : []),
          ],
        },
        orderBy: {
          and: [
            { column: "orderIndex", method: "asc" },
            { column: "id", method: "asc" },
          ],
        },
      },
    });
    const linkedIds = new Set(links.map(({ skillId }) => skillId));
    const selectedIds = ids
      ? ids.filter((id) => linkedIds.has(id))
      : [...linkedIds];
    if (!selectedIds.length) {
      return [];
    }
    const skills = await this.module.skill.find({
      params: {
        filters: {
          and: [
            { column: "id", method: "inArray", value: selectedIds },
            { column: "variant", method: "eq", value: "default" },
          ],
        },
      },
    });
    const skillsById = new Map(skills.map((skill) => [skill.id, skill]));
    return selectedIds.flatMap((id) => {
      const skill = skillsById.get(id);
      return skill ? [skill] : [];
    });
  }
}
