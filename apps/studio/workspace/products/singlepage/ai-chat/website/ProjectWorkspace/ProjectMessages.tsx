import { Component as RbacModuleSubject } from "../../../../../../modules/rbac/subject";

export function ProjectComposer() {
  return <RbacModuleSubject variant="message-create-ai-chat" />;
}
import { Component as SocialModuleThread } from "../../../../../../modules/social/thread";

export function ProjectMessageList() {
  return <SocialModuleThread variant="message-list-ai-chat" />;
}
export { Component as ProjectSourceEditor } from "../../../../../../modules/knowledge/source/singlepage/overview/document/ai-chat/index";
export { Component as ProjectThreadButton } from "../../../../../../modules/social/thread/singlepage/list/item/sidebar/ai-chat/index";
