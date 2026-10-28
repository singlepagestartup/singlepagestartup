"use client";
import { AIChatPreview } from "../../../../../../../index";
import type { IAIChatWebsiteContent } from "../../../../../../website-builder/widget/singlepage/content/ai-chat/content";
export interface IChatPreviewProps {
  content?: IAIChatWebsiteContent;
}
export function Component(_props: IChatPreviewProps = {}) {
  return (
    <AIChatPreview embedded initialHref="/ai-chat/social/profiles/pottery" />
  );
}
