import { linkProjectProfile } from "./ai-chat-models";
import { aiChatAccount } from "./ai-chat-account-fixture";
import {
  createProjectProfile,
  prepareProjectDocuments,
  type IProjectProfile,
} from "./ai-chat-workspace";
import definitions from "../../../modules/social/models/profile/singlepage/ai-chat-project/definitions.json";
export function aiChatProjectFixture(): IProjectProfile {
  const project = createProjectProfile("pottery", "Pottery workshops");
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

export function aiChatWorkspaceFixture() {
  const project = aiChatProjectFixture();
  return {
    initialProjects: [project],
    initialLinks: linkProjectProfile(
      { chats: [], profilesToChats: [] },
      aiChatAccount.profiles[0].id,
      project,
    ),
  };
}
