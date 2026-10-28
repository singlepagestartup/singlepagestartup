import type { Service as SubjectService } from "../../index";
import type { IProfilePresentation } from "@sps/social/models/profile/sdk/model";

/** Only use IDs obtained from records in an already authorized Chat scope. */
export class Service {
  constructor(readonly service: Pick<SubjectService, "socialModule">) {}

  async find(profileIds: string[]): Promise<Map<string, IProfilePresentation>> {
    const selected = [...new Set(profileIds.filter(Boolean))];
    const values = await Promise.all(
      selected.map((id) =>
        this.service.socialModule.profile.profilePresentation({ id }),
      ),
    );
    return new Map(
      values.flatMap((profile) =>
        profile ? [[profile.id, profile] as const] : [],
      ),
    );
  }
}
