import type { Service as SubjectService } from "../../index";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

export interface IExecuteProps {
  socialModuleChatId: string;
}

/** The caller must establish Chat access before expanding its participants. */
export class Service {
  constructor(readonly service: Pick<SubjectService, "socialModule">) {}

  async execute(props: IExecuteProps): Promise<ISocialModuleProfile[]> {
    if (!props.socialModuleChatId)
      throw new Error("Validation error. Chat ID is required");
    return (
      (await this.findForChats([props.socialModuleChatId])).get(
        props.socialModuleChatId,
      ) || []
    );
  }

  async findForChats(
    chatIds: string[],
  ): Promise<Map<string, ISocialModuleProfile[]>> {
    const selected = [...new Set<string>(chatIds.filter(Boolean))];
    const result = new Map<string, ISocialModuleProfile[]>();
    if (!selected.length) return result;
    const links = await this.service.socialModule.profilesToChats.find({
      params: {
        filters: {
          and: [
            {
              column: "chatId",
              method: selected.length === 1 ? "eq" : "inArray",
              value: selected.length === 1 ? selected[0] : selected,
            },
          ],
        },
        orderBy: { and: [{ column: "createdAt", method: "asc" }] },
      },
    });
    const ids = [
      ...new Set<string>(
        (links || [])
          .filter((link) => selected.includes(link.chatId))
          .map((link) => link.profileId),
      ),
    ];
    if (!ids.length) return result;
    const profiles = await this.service.socialModule.profile.find({
      params: {
        filters: { and: [{ column: "id", method: "inArray", value: ids }] },
      },
    });
    const byId = new Map<string, ISocialModuleProfile>(
      profiles?.map((profile: ISocialModuleProfile) => [profile.id, profile]),
    );
    for (const chatId of selected) {
      const members = [
        ...new Set<string>(
          (links || [])
            .filter((link) => link.chatId === chatId)
            .map((link) => link.profileId),
        ),
      ];
      result.set(
        chatId,
        members.flatMap((id) => {
          const profile = byId.get(id);
          return profile ? [profile] : [];
        }),
      );
    }
    return result;
  }
}
