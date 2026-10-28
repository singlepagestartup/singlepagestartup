import type { Service as SubjectService } from "../../index";
import type { IModel, IChatAction } from "@sps/social/models/action/sdk/model";
import { Service as Presentations } from "./presentations";

/** The caller must prove Chat access before supplying its selected Actions. */
export class Service {
  constructor(readonly service: Pick<SubjectService, "socialModule">) {}

  async enrich(actions: IModel[]): Promise<IChatAction[]> {
    if (!actions.length) return [];
    const actionIds = new Set(actions.map((action) => action.id));
    const relations = await this.service.socialModule.profilesToActions.find({
      params: {
        filters: {
          and: [
            { column: "actionId", method: "inArray", value: [...actionIds] },
          ],
        },
      },
    });
    const scoped = relations.filter((relation) =>
      actionIds.has(relation.actionId),
    );
    const profiles = await new Presentations(this.service).find(
      scoped.map((relation) => relation.profileId),
    );
    return actions.map((action) => ({
      ...action,
      actorProfileIds: scoped
        .filter((relation) => relation.actionId === action.id)
        .map((relation) => relation.profileId),
      actorProfiles: scoped
        .filter((relation) => relation.actionId === action.id)
        .flatMap((relation) => {
          const profile = profiles.get(relation.profileId);
          return profile ? [profile] : [];
        }),
    }));
  }
}
