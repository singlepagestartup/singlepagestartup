import type { Service as SubjectService } from "../../index";
import { Service as Participants } from "../../../startup/social-module/chat/participants";
import { Service as Presentations } from "../../../startup/social-module/chat/presentations";
import { Service as ChatActivity } from "./activity";

export interface IFindProps {
  subjectId: string;
  socialModuleProfileId: string;
  includeSubjectProfiles?: boolean;
  includeParticipants?: boolean;
  params?: NonNullable<
    Parameters<SubjectService["modules"]["social"]["chat"]["find"]>[0]
  >["params"];
}

/** A single scoped collection, including all of the acting Subject's profiles. */
export class Service {
  constructor(readonly service: SubjectService) {}

  async find(props: IFindProps) {
    if (!props.subjectId || !props.socialModuleProfileId)
      throw new Error("Validation error. Subject and Profile IDs are required");
    const owned = await this.service.module.subjectsToSocialModuleProfiles.find(
      {
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: props.subjectId },
            ],
          },
        },
      },
    );
    const profileIds = [
      ...new Set<string>(
        (owned || []).map((link) => link.socialModuleProfileId),
      ),
    ];
    if (!profileIds.includes(props.socialModuleProfileId))
      throw new Error(
        "Permission error. Requested social-module profile does not belong to subject",
      );
    const admin = await this.service.socialModuleChatLifecycleIsSubjectAdmin({
      subjectId: props.subjectId,
    });
    let chatIds: string[] | undefined;
    if (!admin) {
      const links = await this.service.modules.social.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "inArray",
                value: props.includeSubjectProfiles
                  ? profileIds
                  : [props.socialModuleProfileId],
              },
            ],
          },
        },
      });
      chatIds = [...new Set<string>((links || []).map((link) => link.chatId))];
      if (!chatIds.length) return [];
    }
    const candidates = await this.service.modules.social.chat.find({
      params: {
        ...props.params,
        ...(!admin
          ? {
              filters: {
                and: [{ column: "id", method: "inArray", value: chatIds! }],
              },
            }
          : {}),
      },
    });
    const access = await this.service.customerWork.chatAccess(
      props.subjectId,
      candidates ?? [],
    );
    const allowedChats = (candidates ?? []).filter(
      ({ id }) => typeof access.get(id) === "string",
    );
    const chats = await new ChatActivity(this.service).forChats(
      props.subjectId,
      allowedChats,
    );
    if (!props.includeParticipants || !chats.length) {
      return chats;
    }
    const participants = await new Participants(this.service).findForChats(
      chats.map((chat) => chat.id),
    );
    const presentations = await new Presentations(this.service).find(
      [...participants.values()].flatMap((profiles) =>
        profiles.map((profile) => profile.id),
      ),
    );
    return chats.map((chat) => ({
      ...chat,
      participants: participants.get(chat.id) || [],
      participantPresentations: (participants.get(chat.id) || []).flatMap(
        (profile) => {
          const presentation = presentations.get(profile.id);
          return presentation ? [presentation] : [];
        },
      ),
    }));
  }
}
