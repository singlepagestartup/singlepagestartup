import {
  type IComponentProps,
  type ContentFeatureFindCardProps,
  type IModuleIconProps,
} from "./interface";
export type { ContentFeatureFindCardProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";
import { Component as Feature } from "../../../feature/index";
import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
type ModuleIcon = ReturnType<typeof createIcon>;

type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

interface FeatureItem {
  title: string;
  description: string;
  icon: ModuleIcon;
}
function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 max-w-2xl sm:mb-10">
      <p className="mb-2 text-sm font-semibold tracking-normal text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-muted-foreground mt-3">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ContentFeatureFindCard(props?: IComponentProps) {
  const { eyebrow, title, description, features } = {
    ...defaultContentFeatureFindCardProps,
    ...props,
  };
  return (
    <div
      id="features"
      className="w-full bg-muted py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-feature-find-card"
      data-ds-layer="singlepage"
      data-module="website-builder"
      data-model="widget"
      data-variant={props?.variant ?? "content-feature-find-card"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          data-ds-imports="website-builder.feature.card"
        >
          {features.map((feature) => (
            <Feature
              variant="card"
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
const ShoppingCart = createIcon("shopping-cart");
const MessageSquare = createIcon("chat");
const Lock = createIcon("lock-key");
const Globe = createIcon("globe");
const FileText = createIcon("file-text");
const Bot = createIcon("robot");
const Bell = createIcon("bell");
const BarChart3 = createIcon("chart-bar");
export const defaultContentFeatureFindCardProps = {
  eyebrow: "Core capabilities",
  title: "Everything you need, modular by design",
  description:
    "Each module works independently and connects seamlessly through a unified relation system.",
  features: [
    {
      icon: Globe,
      title: "Website Builder",
      description:
        "Build pages visually with widgets, sliders, buttons, and logotypes managed from the admin panel.",
    },
    {
      icon: ShoppingCart,
      title: "Ecommerce Engine",
      description:
        "Full product catalog with attributes, categories, orders, and flexible store configurations.",
    },
    {
      icon: FileText,
      title: "Blog & Content",
      description:
        "Rich-text articles with localized content, categories, and SEO-ready slug management.",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Track metrics, build custom widgets, and monitor performance from a unified dashboard.",
    },
    {
      icon: MessageSquare,
      title: "Social & Messaging",
      description:
        "Profiles, chats, threads, and actions - everything for community and social interactions.",
    },
    {
      icon: Bot,
      title: "AI Agents",
      description:
        "Configure and manage AI-powered agents with custom widgets and behavior settings.",
    },
    {
      icon: Bell,
      title: "Notifications",
      description:
        "Templates, topics, and delivery channels for transactional and marketing notifications.",
    },
    {
      icon: Lock,
      title: "RBAC & Security",
      description:
        "Roles, permissions, actions, and identity management for enterprise-grade access control.",
    },
  ] satisfies FeatureItem[],
};
