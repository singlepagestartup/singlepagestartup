import { Component as Header } from "./index";
import { useState } from "react";
import { Component as ProjectSelect } from "../../../../../social/models/profile/singlepage/ai-chat-project-select/index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../../../rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../../workspace/utils/products/ai-chat-account-fixture";

function Example() {
  const [profiles, setProfiles] = useState([
    { id: "pottery", title: "Pottery workshops" },
    { id: "photography", title: "Portrait photography" },
  ]);
  const [selected, setSelected] = useState("pottery");
  return (
    <div className="@container font-sps">
      <Header
        page="chat"
        projectNavigation={(props) => (
          <ProjectSelect
            data={profiles}
            value={selected}
            onChange={(id) => {
              setSelected(id);
              props.onNavigate();
            }}
            onCreate={() => {
              const id = `profile-${profiles.length + 1}`;
              setProfiles((current) => [
                ...current,
                { id, title: "New project" },
              ]);
              setSelected(id);
              props.onNavigate();
            }}
            onCloseAutoFocus={props.onCloseAutoFocus}
          />
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
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
