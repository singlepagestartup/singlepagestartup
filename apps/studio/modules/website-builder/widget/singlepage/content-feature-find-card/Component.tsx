import { Component as WebsiteBuilderModuleFeature } from "../../../feature";
import {
  BarChart3,
  Bell,
  Bot,
  FileText,
  Globe,
  Lock,
  MessageSquare,
  ShoppingCart,
  type ModuleIcon,
} from "../../../../../workspace/utils/components/ModuleIcons";

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
      <p className="mb-2 text-sm font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
        {eyebrow}
      </p>
      <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-[var(--workspace-brand-foreground)]">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-[var(--workspace-brand-muted)] mt-3">
          {description}
        </p>
      ) : null}
    </div>
  );
}

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

export type ContentFeatureFindCardProps =
  typeof defaultContentFeatureFindCardProps;

export function ContentFeatureFindCard(
  props?: Partial<ContentFeatureFindCardProps>,
) {
  const { eyebrow, title, description, features } = {
    ...defaultContentFeatureFindCardProps,
    ...props,
  };

  return (
    <div
      id="features"
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-feature-find-card"
      data-ds-layer="singlepage"
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
            <WebsiteBuilderModuleFeature
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
