import type { IComponentPropsExtended } from "./interface";

type TimelineItem = NonNullable<
  IComponentPropsExtended["socialModuleMessagesAndActionsQuery"]
>[number];

function getTime(value?: string | Date | null) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return time;
}

function getFallbackSortKey(item: TimelineItem) {
  return `${item.type}:${item.data.id || ""}`;
}

export function sortSocialModuleMessagesAndActions(items: TimelineItem[]) {
  return items.slice().sort((a, b) => {
    const timeDiff = getTime(a.data.createdAt) - getTime(b.data.createdAt);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return getFallbackSortKey(a).localeCompare(getFallbackSortKey(b));
  });
}

export function createSocialModuleMessagesAndActionsQuery(props: {
  socialModuleMessages?: IComponentPropsExtended["socialModuleMessages"];
  socialModuleActions?: IComponentPropsExtended["socialModuleActions"];
}) {
  if (!props.socialModuleMessages || !props.socialModuleActions) {
    return [];
  }

  return sortSocialModuleMessagesAndActions([
    ...props.socialModuleMessages.map((socialModuleMessage) => {
      return {
        type: "message" as const,
        data: socialModuleMessage,
      };
    }),
    ...props.socialModuleActions.map((socialModuleAction) => {
      return {
        type: "action" as const,
        data: socialModuleAction,
      };
    }),
  ]);
}
