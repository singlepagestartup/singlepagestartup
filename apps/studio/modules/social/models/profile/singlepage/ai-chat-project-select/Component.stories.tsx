import { useState } from "react";
import { Component } from "./index";
import type { IProjectProfileOption } from "./index";
import type { Meta, StoryObj } from "@storybook/react";

export interface IProfileSelectStoryProps {
  initialProfiles?: IProjectProfileOption[];
  onNavigate?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
}

function Example({
  initialProfiles = [
    { id: "pottery", title: "Pottery workshops" },
    { id: "photography", title: "Portrait photography" },
  ],
  onNavigate,
  onCloseAutoFocus,
}: IProfileSelectStoryProps = {}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [selected, setSelected] = useState(initialProfiles[0]?.id ?? "");
  return (
    <Component
      data={profiles}
      value={selected}
      onChange={(id) => {
        setSelected(id);
        onNavigate?.();
      }}
      onCreate={() => {
        const id = `profile-${profiles.length + 1}`;
        setProfiles((current) => [...current, { id, title: "New project" }]);
        setSelected(id);
        onNavigate?.();
      }}
      onCloseAutoFocus={onCloseAutoFocus}
    />
  );
}

const meta = {
  id: "modules-social-models-profile-singlepage-ai-chat-project-select",
  title: "Modules/Social/Models/Profile/Singlepage/ai-chat-project-select",
  component: Example,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Empty: StoryObj<typeof meta> = {
  args: { initialProfiles: [] },
};
