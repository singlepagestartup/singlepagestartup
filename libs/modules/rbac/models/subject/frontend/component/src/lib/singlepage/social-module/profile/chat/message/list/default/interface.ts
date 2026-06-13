export { type IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel } from "@sps/rbac/models/subject/sdk/model";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { ISpsComponentBase } from "@sps/ui-adapter";
import { type IResult } from "@sps/rbac/models/subject/sdk/server";

export const variant =
  "social-module-profile-chat-message-list-default" as const;

export interface IComponentProps extends ISpsComponentBase {
  language: string;
  data: IModel;
  socialModuleProfile: ISocialModuleProfile;
  artificialIntelligenceOpponentProfile?: ISocialModuleProfile | null;
  knowledgeAssistantProfile?: ISocialModuleProfile | null;
  socialModuleChat: ISocialModuleChat;
  socialModuleThreadId: string;
  variant: typeof variant;
  className?: string;
}

/**
 * Message/action data types for the timeline boundary. The queries that
 * produce them live INSIDE MessageTimelineSection (issue #195): the chat
 * shell never receives message arrays as props, so cache appends/refetches
 * rerender only the timeline area.
 */
export type ISocialModuleMessages =
  IResult["ISocialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFindResult"];

export type ISocialModuleActions =
  IResult["ISocialModuleProfileFindByIdChatFindByIdActionFindResult"];

export type ISocialModuleMessagesAndActionsQuery = (
  | {
      type: "message";
      data: ISocialModuleMessages[0];
    }
  | {
      type: "action";
      data: ISocialModuleActions[0];
    }
)[];

export interface IComponentPropsExtended extends IComponentProps {}
