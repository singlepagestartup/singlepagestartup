import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProjectDesign, type ProjectDesignView } from "../../ProjectDesign";
import { projectDesignData } from "../data";
import { designWorkspaces } from "../source";

const meta = {
  title: "Workspace/Design/singlepage",
  component: ProjectDesign,
  parameters: { controls: { disable: true }, layout: "fullscreen" },
  args: {
    data: projectDesignData(designWorkspaces.singlepage, "singlepage"),
    view: "overview",
  },
} satisfies Meta<typeof ProjectDesign>;

export default meta;
type Story = StoryObj<typeof meta>;

function story(view: ProjectDesignView): Story {
  return { args: { view } };
}

export const Overview = story("overview");
export const BrandOverview = story("brand");
export const ColorAndTypography = story("tokens");
export const Imagery = story("imagery");
export const KeyComponents = story("components");
export const PrimaryLandingPage = story("landing");
export const MobilePage = story("mobile");
export const Form = story("form");
export const SuccessState = story("success");
export const AcquisitionCreative = story("acquisition");
