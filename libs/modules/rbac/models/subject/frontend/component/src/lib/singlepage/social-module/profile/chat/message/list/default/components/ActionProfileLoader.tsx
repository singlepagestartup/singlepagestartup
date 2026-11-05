"use client";
import type { ReactNode } from "react";
import type { IChatAction } from "@sps/social/models/action/sdk/model";
import type { ProfileSummary } from "../types";
interface ActionProfileLoaderProps {
  action: IChatAction;
  language: string;
  children: (profile: ProfileSummary) => ReactNode;
}
/** A private Chat actor need not be a public Blog author. */
export function ActionProfileLoader(props: ActionProfileLoaderProps) {
  const profile = props.action.actorProfiles?.[0];
  const name =
    profile?.title?.[props.language] ||
    profile?.title?.en ||
    (props.language === "ru" ? "Система" : "System");
  return props.children({
    id: profile?.id ?? "unknown",
    slug: name,
    initial: name.charAt(0).toUpperCase(),
    href: "#",
  });
}
