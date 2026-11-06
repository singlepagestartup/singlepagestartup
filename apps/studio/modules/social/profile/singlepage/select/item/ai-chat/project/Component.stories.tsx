import { Component as Profile } from "../../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
function Component() {
  return (
    <DropdownMenu.Root defaultOpen modal={false}>
      <DropdownMenu.Trigger className="rounded-xl border border-border bg-card px-4 py-3">
        Projects
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        forceMount
        className="w-64 rounded-xl border border-border bg-card p-2 text-foreground"
      >
        <Profile
          variant="select-item-ai-chat-project"
          data={{
            id: "pottery",
            name: "Pottery workshops",
            variant: "scope-ai-chat-project",
          }}
          selected
        />
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
const meta = {
  id: "modules-social-models-profile-singlepage-select-item-ai-chat-project",
  title: "Modules/Social/Profile/Singlepage/select/item/ai-chat/project",
  component: Component,
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
