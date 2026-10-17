import { api as threadApi } from "@sps/social/models/thread/sdk/server";
import { api as linksApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import type { IModel as IThread } from "@sps/social/models/thread/sdk/model";
import { getAIChatDocument } from "@sps/rbac/models/subject/sdk/model";
import { AI_CHAT_DOCUMENTS, RBAC_SECRET_KEY } from "@sps/shared-utils";
import type { ISocialModule } from "../../../../di";

export interface IExecuteProps {
  profileId: string;
  chatId: string;
  /** The lifecycle's initial Thread, or the explicitly identified legacy Products Thread. */
  initialThread?: IThread;
}

export class Service {
  constructor(
    readonly socialModule: Pick<ISocialModule, "thread" | "chatsToThreads">,
  ) {}

  async execute(props: IExecuteProps): Promise<IThread[]> {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Cache-Control": "no-store",
      },
    };
    const links = await this.socialModule.chatsToThreads.find({
      params: {
        filters: {
          and: [{ column: "chatId", method: "eq", value: props.chatId }],
        },
      },
    });
    const ids = (links || []).map((link) => link.threadId);
    const threads = ids.length
      ? await this.socialModule.thread.find({
          params: {
            filters: { and: [{ column: "id", method: "inArray", value: ids }] },
          },
        })
      : [];
    const initial = threads?.find(
      (thread) => thread.id === props.initialThread?.id,
    );
    const legacy = initial?.metadata?.["aiChatDocument"] as
      | { profileId?: string; sourceIds?: string[] }
      | undefined;
    const reusableKey =
      legacy?.profileId === props.profileId ? "products" : "brief";
    const result: IThread[] = [];
    for (const [index, definition] of AI_CHAT_DOCUMENTS.entries()) {
      const existing = threads?.find((thread) => {
        const document = getAIChatDocument(thread.metadata);
        return (
          document?.profileId === props.profileId &&
          document.key === definition.key
        );
      });
      if (existing) {
        result.push(existing);
        continue;
      }
      const slug = `ai-chat-${props.chatId}-${props.profileId}-${definition.key}`;
      const candidates = await this.socialModule.thread.find({
        params: {
          filters: { and: [{ column: "slug", method: "eq", value: slug }] },
        },
      });
      const pending = candidates?.find(
        (thread) =>
          thread.slug === slug &&
          getAIChatDocument(thread.metadata)?.profileId === props.profileId &&
          getAIChatDocument(thread.metadata)?.key === definition.key,
      );
      const reusable =
        initial &&
        !getAIChatDocument(initial.metadata) &&
        definition.key === reusableKey
          ? initial
          : undefined;
      const data = {
        title: definition.title,
        metadata: {
          ...(reusable?.metadata || {}),
          aiChatDocument: {
            key: definition.key,
            profileId: props.profileId,
            sourceIds:
              reusable &&
              legacy?.profileId === props.profileId &&
              Array.isArray(legacy.sourceIds)
                ? [...new Set(legacy.sourceIds)]
                : [],
          },
        },
      };
      let updatedReusable: IThread | null = null;
      if (reusable) {
        updatedReusable = await threadApi.updateMetadataNamespace({
          id: reusable.id,
          namespace: "aiChatDocument",
          expectedValue: reusable.metadata.aiChatDocument ?? null,
          value: data.metadata.aiChatDocument,
          options,
        });
        if (!updatedReusable)
          throw new Error(
            "Thread document changed concurrently. Retry document initialization.",
          );
      }
      const thread =
        pending ||
        (reusable
          ? await threadApi.update({
              id: reusable.id,
              data: { title: data.title },
              options,
            })
          : await threadApi.create({
              data: { ...data, slug, variant: "default" },
              options,
            }));
      if (!reusable || pending)
        await linksApi.create({
          data: {
            chatId: props.chatId,
            threadId: thread.id,
            variant: "ai-chat",
            orderIndex: index,
          },
          options,
        });
      result.push(thread);
    }
    return result;
  }
}
