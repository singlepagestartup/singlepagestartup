import { Component as RbacModuleSubject } from "../../../../../../modules/rbac/subject";

export function ProjectComposer() {
  return <RbacModuleSubject variant="message-create-ai-chat" />;
}
export { Component as ProjectMessageList } from "../../../../../../modules/social/message/singlepage/list/ai-chat/index";
export { Component as ProjectSourceEditor } from "../../../../../../modules/knowledge/source/singlepage/overview/document/ai-chat/index";
export { Component as ProjectThreadButton } from "../../../../../../modules/social/thread/singlepage/list/item/sidebar/ai-chat/index";
