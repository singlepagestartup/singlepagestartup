import {
  createChatProject,
  prepareProjectDocuments,
  type IChatProject,
} from "../../../../libs/shared/frontend/client/utils/src/lib/ai-chat/workspace";
import definitions from "./../../../../libs/modules/social/relations/chats-to-threads/frontend/component/src/lib/singlepage/ai-chat-workspace/definitions.json";
export function aiChatProjectFixture(): IChatProject {
  const project = createChatProject("pottery", "Pottery workshops");
  project.notes =
    "Weekend pottery workshops for adults trying pottery for the first time. A small group makes a cup by hand.";
  return {
    ...prepareProjectDocuments(
      project,
      Object.values(definitions).filter((item) => item.id !== "product"),
    ),
    stage: "documents" as const,
  };
}
