"use client";
import type { ReactNode } from "react";
import type { IChatMessage } from "@sps/social/models/message/sdk/model";
import type {
  IModel as ISocialModuleProfile,
  IProfilePresentation,
} from "@sps/social/models/profile/sdk/model";
interface MessageProfileLoaderProps {
  message: IChatMessage;
  participants?: ISocialModuleProfile[];
  children: (author: {
    presentation: IProfilePresentation;
    profile?: ISocialModuleProfile;
  }) => ReactNode;
}
/** Sender badges are returned by the authorized Message operation, including departed senders. */
export function MessageProfileLoader(props: MessageProfileLoaderProps) {
  const presentation = props.message.authorProfiles?.[0];
  const id = presentation?.id ?? props.message.authorProfileIds?.[0];
  const profile = id
    ? props.participants?.find((item) => item.id === id)
    : undefined;
  const fallback: IProfilePresentation = profile
    ? {
        id: profile.id,
        title: profile.title,
        subtitle: profile.subtitle,
        avatar: null,
      }
    : {
        id: "unknown",
        title: { en: "Unknown profile", ru: "Неизвестный профиль" },
        subtitle: {},
        avatar: null,
      };
  return props.children({ presentation: presentation ?? fallback, profile });
}
