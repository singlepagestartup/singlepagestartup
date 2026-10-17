import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as Icon } from "../..";
import icons from "./icons.json";

const meta = {
  id: "modules-shared-icon-singlepage-phosphor",
  title: "Modules/Shared/Icon/Singlepage/Phosphor",
  component: Icon,
  args: { variant: "phosphor", name: "robot" },
} satisfies Meta<
  Extract<React.ComponentProps<typeof Icon>, { variant: "phosphor" }>
>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Collection: StoryObj<typeof meta> = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
      {(Object.keys(icons) as Array<keyof typeof icons>).map((name) => (
        <div
          key={name}
          className="flex flex-col items-center gap-2 text-center text-xs"
        >
          <Icon variant="phosphor" name={name} />
          <span>{name}</span>
        </div>
      ))}
    </div>
  ),
};
