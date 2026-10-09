import { Component as Header } from "./index";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import { ProfilesProvider } from "../../../../../social/models/profile/singlepage/ai-chat-project/Profiles";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-account/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "../../../../../../workspace/utils/products/ai-chat-workspace-fixture";
function Example() {
  return (
    <div className="@container font-sps">
      <Header
        page="chat"
        projectNavigation={(props) => (
          <ProjectSelect profileId="pottery" {...props} />
        )}
      />
    </div>
  );
}
const meta = {
  id: "modules-website-builder-models-widget-singlepage-ai-chat-header",
  title: "Modules/Website-Builder/Models/Widget/Singlepage/ai-chat-header",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <ProfilesProvider {...aiChatWorkspaceFixture()}>
          <Story />
        </ProfilesProvider>
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
