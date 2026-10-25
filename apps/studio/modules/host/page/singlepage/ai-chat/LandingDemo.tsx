"use client";
import { Component as RbacModuleWidget } from "../../../../rbac/widget";
import { AccountProvider } from "../../../../rbac/subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../../rbac/subject/singlepage/me/account/fixture";
import { ProfilesProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profiles";
import { ProjectProvider } from "../../../../social/profile/singlepage/scope/ai-chat/project/Profile";
import {
  aiChatSourceFixture,
  aiChatWorkspaceFixture,
} from "../../../../social/profile/singlepage/scope/ai-chat/project/fixtures";
/** Uses the same public workspace composition as the project Page, with local data. */
export function LandingDemo() {
  const fixture = aiChatSourceFixture();
  return (
    <AccountProvider
      account={aiChatAccount}
      signedIn
      projectHref="/ai-chat/social/profiles/pottery"
    >
      <ProfilesProvider {...aiChatWorkspaceFixture()}>
        <ProjectProvider
          profileId="pottery"
          preview={{
            source: fixture.source,
            files: fixture.files,
            sourceFileIds: fixture.fileIds,
          }}
        >
          <RbacModuleWidget
            variant="subject-me-social-module-profile-id-chat-id-thread-id-ai-chat"
            profileId="pottery"
            chatId="pottery:project-chat"
            embedded
          />
        </ProjectProvider>
      </ProfilesProvider>
    </AccountProvider>
  );
}
