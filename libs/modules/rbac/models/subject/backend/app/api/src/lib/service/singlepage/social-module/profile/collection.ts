import type { Service as SubjectService } from "../../index";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";

export interface IFindProps {
  subjectId: string;
  socialModuleChatId?: string;
  params?: Record<string, any>;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async find(props: IFindProps): Promise<IProfile[]> {
    const relations =
      await this.service.module.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: props.subjectId },
            ],
          },
        },
      });
    const ownIds = [
      ...new Set<string>((relations || []).map((r) => r.socialModuleProfileId)),
    ];
    if (!ownIds.length) return [];
    let profileIds = ownIds;
    if (props.socialModuleChatId) {
      const memberships =
        await this.service.modules.social.profilesToChats.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: props.socialModuleChatId,
                },
                { column: "profileId", method: "inArray", value: ownIds },
              ],
            },
          },
        });
      const joined = new Set(
        (memberships || [])
          .filter((link) => link.chatId === props.socialModuleChatId)
          .map((link) => link.profileId),
      );
      profileIds = ownIds.filter((id) => joined.has(id));
      if (
        !profileIds.length &&
        (await this.service.socialModuleChatLifecycleIsSubjectAdmin({
          subjectId: props.subjectId,
        }))
      )
        profileIds = ownIds;
      if (!profileIds.length) return [];
    }
    const profiles = await this.service.modules.social.profile.find({
      params: {
        ...props.params,
        filters: {
          ...props.params?.filters,
          and: [
            ...(props.params?.filters?.and || []),
            { column: "id", method: "inArray", value: profileIds },
          ],
        },
      },
    });
    const allowed = new Set(profileIds);
    return (profiles || []).filter((profile: IProfile) =>
      allowed.has(profile.id),
    );
  }
}
