import { Component as SocialModuleProfile } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
function Example() {
  return (
    <DropdownMenu.Root defaultOpen modal={false}>
      <DropdownMenu.Trigger className="rounded-xl border border-sps-line bg-sps-white px-4 py-3">
        Projects
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        forceMount
        className="w-64 rounded-xl border border-sps-line bg-sps-white p-2 text-sps-graphite"
      >
        <SocialModuleProfile
          variant="ai-chat-project-item"
          data={{
            id: "pottery",
            name: "Pottery workshops",
            variant: "ai-chat-project",
          }}
          selected
        />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-project-item",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-project-item",
  component: Example,
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
