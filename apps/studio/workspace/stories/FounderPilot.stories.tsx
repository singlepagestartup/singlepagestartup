import type { Meta, StoryObj } from "@storybook/react-vite";

import inventoryJson from "../../inventory/workspace.generated.json";
import {
  PilotDesign,
  type IPilotDesignData,
  type PilotDesignView,
} from "../PilotDesign";
import type { IStudioWorkspaceInventory } from "../types";

const inventory = inventoryJson as IStudioWorkspaceInventory;
const pilot = inventory.workspaces.find(
  (workspace) => workspace.id === "example.founder-pilot",
);
if (!pilot)
  throw new Error(
    "Founder pilot is missing from the Studio workspace inventory",
  );

function content(id: string): string {
  const artifact = pilot.artifacts.find((candidate) => candidate.id === id);
  if (!artifact) throw new Error(`Founder pilot artifact is missing: ${id}`);
  return artifact.content;
}

function field(source: string, label: string, fallback: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const value = source.match(
    new RegExp("^- " + escaped + ": `([^`]+)`", "m"),
  )?.[1];
  return value ?? fallback;
}

const brand = content("pilot.brand");
const website = content("pilot.website");
const data: IPilotDesignData = {
  name: field(brand, "Brand name", "Рама").split(" — ")[0],
  primary: field(brand, "Primary", "#163D37"),
  accent: field(brand, "Accent", "#D97745"),
  paper: field(brand, "Paper", "#F5F0E8"),
  ink: field(brand, "Ink", "#14211E"),
  muted: field(brand, "Muted", "#66736F"),
  line: field(brand, "Line", "#C9D0C9"),
  displayType: field(brand, "Display type", "Georgia, serif"),
  bodyType: field(brand, "Body type", "system-ui, sans-serif"),
  eyebrow: field(website, "Eyebrow", "Ремонт деревянных окон · Москва"),
  headline: field(
    website,
    "Headline",
    "Сначала разберёмся с окном. Потом решим, что ремонтировать.",
  ),
  subheadline: field(
    website,
    "Subheadline",
    "Пришлите фото и опишите проблему.",
  ),
  primaryCta: field(website, "Primary CTA", "Отправить фото на оценку"),
  secondaryCta: field(website, "Secondary CTA", "Как проходит работа"),
  successTitle: field(website, "Success title", "Фото и описание получены"),
  successCopy: field(
    website,
    "Success copy",
    "Алексей проверит, хватает ли информации, и ответит в следующий рабочий день.",
  ),
  assetRoot: "/founder-pilot-assets",
};

const meta = {
  title: "Founder Pilot/Design",
  component: PilotDesign,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: { data, view: "brand" },
} satisfies Meta<typeof PilotDesign>;

export default meta;
type Story = StoryObj<typeof meta>;

function story(view: PilotDesignView): Story {
  return { args: { data, view } };
}

export const BrandOverview = story("brand");
export const ColorAndTypography = story("tokens");
export const Imagery = story("imagery");
export const KeyComponents = story("components");
export const PrimaryLandingPage = story("landing");
export const MobilePage = story("mobile");
export const Form = story("form");
export const SuccessState = story("success");
export const AcquisitionCreative = story("acquisition");
