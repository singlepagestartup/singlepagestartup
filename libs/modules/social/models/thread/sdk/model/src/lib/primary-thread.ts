export interface ISocialModuleChatToThreadCandidate {
  createdAt?: unknown;
  orderIndex?: number | null;
  threadId?: string | null;
}

interface ISocialModuleThreadCandidate {
  createdAt?: unknown;
  id: string;
}

interface ILinkedThreadCandidate<
  TSocialModuleThread extends ISocialModuleThreadCandidate,
> {
  relation: ISocialModuleChatToThreadCandidate;
  thread: TSocialModuleThread;
}

function getChronologyTimestamp(value: unknown) {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string" || typeof value === "number") {
    const timestamp = new Date(value).getTime();

    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return Number.MAX_SAFE_INTEGER;
}

export function selectPrimaryLinkedThread<
  TSocialModuleThread extends ISocialModuleThreadCandidate,
>(props: {
  socialModuleChatsToThreads: ISocialModuleChatToThreadCandidate[];
  socialModuleThreads: TSocialModuleThread[];
}) {
  const socialModuleThreadsById = new Map(
    props.socialModuleThreads.map((socialModuleThread) => {
      return [socialModuleThread.id, socialModuleThread] as const;
    }),
  );
  const linkedThreads: ILinkedThreadCandidate<TSocialModuleThread>[] = [];

  for (const socialModuleChatToThread of props.socialModuleChatsToThreads) {
    if (!socialModuleChatToThread.threadId) {
      continue;
    }

    const socialModuleThread = socialModuleThreadsById.get(
      socialModuleChatToThread.threadId,
    );

    if (!socialModuleThread) {
      continue;
    }

    linkedThreads.push({
      relation: socialModuleChatToThread,
      thread: socialModuleThread,
    });
  }

  linkedThreads.sort((left, right) => {
    const orderIndexDifference =
      (left.relation.orderIndex ?? Number.MAX_SAFE_INTEGER) -
      (right.relation.orderIndex ?? Number.MAX_SAFE_INTEGER);

    if (orderIndexDifference !== 0) {
      return orderIndexDifference;
    }

    const relationCreatedAtDifference =
      getChronologyTimestamp(left.relation.createdAt) -
      getChronologyTimestamp(right.relation.createdAt);

    if (relationCreatedAtDifference !== 0) {
      return relationCreatedAtDifference;
    }

    const threadCreatedAtDifference =
      getChronologyTimestamp(left.thread.createdAt) -
      getChronologyTimestamp(right.thread.createdAt);

    if (threadCreatedAtDifference !== 0) {
      return threadCreatedAtDifference;
    }

    return left.thread.id.localeCompare(right.thread.id);
  });

  return linkedThreads[0]?.thread;
}
