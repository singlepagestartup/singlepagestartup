import { getLocalizedText } from "@sps/shared-utils/localized-text";
import type { Service as SubjectService } from "../../index";
import { Service as Participants } from "../../../startup/social-module/chat/participants";
import { Service as Presentations } from "../../../startup/social-module/chat/presentations";
import { Service as ChatActivity } from "./activity";

export interface IFindProps {
  subjectId: string;
  socialModuleProfileId: string;
  includeSubjectProfiles?: boolean;
  includeParticipants?: boolean;
  membershipsOnly?: boolean;
  search?: string;
  language?: string;
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
    const admin =
      !props.membershipsOnly &&
      (await this.service.socialModuleChatLifecycleIsSubjectAdmin({
        subjectId: props.subjectId,
      }));
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
      if (!chatIds.length) {
        return [];
      }
    }
    const filters = chatIds
      ? {
          and: [{ column: "id", method: "inArray" as const, value: chatIds }],
        }
      : undefined;
    const search = props.search?.trim().toLowerCase();
    const language = props.language ?? "en";
    const untitled = language === "ru" ? "Чат без названия" : "Untitled chat";
    const chatService = this.service.modules.social.chat;
    const readAllowed = async (offset?: number, limit?: number) => {
      const candidates = await chatService.find({
        params: {
          ...props.params,
          filters: filters ?? props.params?.filters,
          offset,
          limit,
        },
      });
      const matches = search
        ? candidates.filter((chat) =>
            getLocalizedText(chat.title, language, untitled)
              .toLowerCase()
              .includes(search),
          )
        : candidates;
      const access = await this.service.customerWork.chatAccess(
        props.subjectId,
        matches,
      );
      const visible = matches.filter(
        ({ id }) => typeof access.get(id) === "string",
      );
      return { visible, count: candidates.length };
    };
    let allowedChats;
    if (props.membershipsOnly && props.params?.limit) {
      // An inaccessible conversation must not consume a position in the buyer's inbox.
      const offset = Math.max(0, props.params.offset ?? 0);
      const end = offset + props.params.limit;
      const batchSize = Math.max(50, props.params.limit);
      const visible: Awaited<ReturnType<typeof chatService.find>> = [];
      let cursor = 0;
      while (visible.length < end) {
        const batch = await readAllowed(cursor, batchSize);
        visible.push(...batch.visible);
        if (batch.count < batchSize) {
          break;
        }
        cursor += batch.count;
      }
      allowedChats = visible.slice(offset, end);
    } else {
      const batch = await readAllowed(
        props.params?.offset,
        props.params?.limit,
      );
      allowedChats = batch.visible;
    }
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
