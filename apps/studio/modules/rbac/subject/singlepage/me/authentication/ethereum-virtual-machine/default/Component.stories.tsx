import type { Meta, StoryObj } from "@storybook/react";
import { Component as Subject } from "../../../../../index";
import type { IEthereumVirtualMachineProps } from "./interface";
function Component(props: IEthereumVirtualMachineProps) {
  return (
    <Subject
      {...props}
      key={props.initialState}
      variant="me-authentication-ethereum-virtual-machine-default"
    />
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-me-authentication-ethereum-virtual-machine-default",
  title:
    "Modules/RBAC/Subject/Singlepage/authentication/ethereum-virtual-machine/default",
  component: Component,
  args: { initialState: "idle" },
  argTypes: {
    initialState: {
      control: "select",
      options: ["idle", "authorize", "complete", "error"],
    },
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Component>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
