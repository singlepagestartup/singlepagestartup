import { websocketManager } from "@sps/backend-utils";
import { STALE_TIME } from "@sps/shared-utils";

export interface IMutationEffects {
  topics: readonly string[];
  payload: string;
  tags?: readonly string[];
}

export interface IMutationEffectsPublisherProps {
  invalidateTopics: (topics: readonly string[]) => Promise<void>;
  revalidateTag?: (tag: string) => Promise<void>;
  broadcast?: (message: unknown) => void;
}

/** Call only after commit; the injected cache boundary keeps its failure policy. */
export function createMutationEffectsPublisher(
  props: IMutationEffectsPublisherProps,
) {
  return async (effects: IMutationEffects): Promise<void> => {
    const topics = [...new Set(effects.topics)].filter(Boolean);
    if (!topics.length) return;
    await props.invalidateTopics(topics);
    if (props.revalidateTag)
      await Promise.all(
        [...new Set([effects.payload, ...(effects.tags || [])])]
          .filter(Boolean)
          .map((tag) => props.revalidateTag!(tag)),
      );
    const now = Date.now();
    (
      props.broadcast ||
      ((message) => websocketManager.broadcastMessage(message))
    )({
      slug: "revalidation",
      payload: effects.payload,
      topics,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + STALE_TIME * 5).toISOString(),
    });
  };
}
