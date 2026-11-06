import { Component as RbacModuleSubject } from "../Preview/components/rbac/subject/index";

export function ProjectComposer() {
  return <RbacModuleSubject variant="message-create-ai-chat" />;
}
import { Component as SocialModuleThread } from "../Preview/components/social/thread/index";

export function ProjectMessageList() {
  return <SocialModuleThread variant="message-list-ai-chat" />;
}
export { Component as ProjectSourceEditor } from "../Preview/components/knowledge/source/singlepage/overview/document/ai-chat/index";
export { Component as ProjectThreadButton } from "../Preview/components/social/thread/singlepage/list/item/sidebar/ai-chat/index";
