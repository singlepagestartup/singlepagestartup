import { Component as Profile } from "../../../../../..";
import type { Meta, StoryObj } from "@storybook/react";
import { SourceProvider } from "../../../../../../../../knowledge/source/singlepage/id/ai-chat/Source";
function Component() {
  return (
    <SourceProvider profileId="pottery">
      <div className="bg-default p-4 text-default-foreground">
        <Profile
          variant="knowledge-module-source-list-sidebar-ai-chat"
          href="/ai-chat/social/profiles/pottery"
          selected
        />
      </div>
    </SourceProvider>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-knowledge-module-source-list-sidebar-ai-chat",
  title:
    "Modules/Social/Profile/Singlepage/knowledge/source/list/sidebar/ai-chat",
  component: Component,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
