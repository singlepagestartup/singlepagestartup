import {
  createChatProject,
  prepareProjectDocuments,
  type IChatProject,
} from "./ai-chat-workspace";
import definitions from "../../../modules/social/relations/chats-to-threads/singlepage/ai-chat-workspace/definitions.json";
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
