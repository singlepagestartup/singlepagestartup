import { Component as RbacModuleSubject } from "../../../../../../modules/rbac/subject";

export function ProjectComposer() {
  return <RbacModuleSubject variant="ai-chat-message-create" />;
}
export { Component as ProjectConversation } from "../../../../../../modules/social/thread/singlepage/ai-chat-conversation/index";
export { Component as ProjectSourceEditor } from "../../../../../../modules/knowledge/source/singlepage/ai-chat-document/index";
export { Component as ProjectThreadButton } from "../../../../../../modules/social/thread/singlepage/ai-chat-sidebar-item/index";
