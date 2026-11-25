import type { SubjectServiceDependencies } from "../../index";
import {
  CHAT_TYPING_TTL_MS,
  type IModel,
  type IChatAction,
} from "@sps/social/models/action/sdk/model";
import { Service as Presentations } from "../../../startup/social-module/chat/presentations";

/** The caller must prove Chat access before supplying its selected Actions. */
export class Service {
  constructor(readonly service: SubjectServiceDependencies) {}

  async setTyping(input: {
    chatId: string;
    threadId: string;
    profileId: string;
    sessionId: string;
    active: boolean;
  }) {
    const { chatId, threadId, profileId, sessionId, active } = input;
    const [membership] = await this.service.modules.social.profilesToChats.find(
      {
        params: {
          filters: {
            and: [
              { column: "chatId", method: "eq", value: chatId },
              { column: "profileId", method: "eq", value: profileId },
            ],
          },
          limit: 1,
        },
      },
    );
    if (!membership) {
      throw new Error("Not found error. Chat participant not found");
    }
    return this.service.modules.social.threadsToActions.withTypingAction(
      threadId,
      profileId,
      async (existing) => {
        const social = this.service.modules.social;
        const now = Date.now();
        if (
          active &&
          existing &&
          new Date(existing.expiresAt).getTime() <= now
        ) {
          await social.action.delete({ id: existing.id });
          existing = null;
        }
        const leases: Record<string, number> = {};
        for (const [session, expiry] of Object.entries(
          existing?.payload?.sessions ?? {},
        )) {
          if (
            session !== sessionId &&
            typeof expiry === "number" &&
            expiry > now
          ) {
            leases[session] = expiry;
          }
        }
        if (active) {
          leases[sessionId] = now + CHAT_TYPING_TTL_MS;
        }
        const expiries = Object.values(leases);
        if (!expiries.length) {
          if (existing) {
            await social.action.delete({ id: existing.id });
          }
          return;
        }
        const data = {
          expiresAt: new Date(Math.max(...expiries)),
          payload: { sessions: leases },
        };
        if (existing) {
          await social.action.update({ id: existing.id, data });
          return;
        }
        const { id: actionId } = await social.action.create({
          data: { variant: "typing", ...data },
        });
        await social.chatsToActions.create({ data: { chatId, actionId } });
        await social.threadsToActions.create({ data: { threadId, actionId } });
        await social.profilesToActions.create({
          data: { profileId, actionId },
        });
      },
    );
  }

  async enrich(actions: IModel[]): Promise<IChatAction[]> {
    actions = actions.filter(
      (action) =>
        action.variant !== "typing" ||
        new Date(action.expiresAt).getTime() > Date.now(),
    );
    if (!actions.length) {
      return [];
    }
    const actionIds = new Set(actions.map((action) => action.id));
    const relations = await this.service.modules.social.profilesToActions.find({
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
      ...(action.variant === "typing" && { payload: {} }),
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
