import {
  Component as WebsiteBuilderModuleFeature,
  type FeatureTestimotionalProps,
} from "../../../feature";

const avatar1Url =
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const avatar2Url =
  "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcxNjEyNDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const avatar3Url =
  "https://images.unsplash.com/photo-1758599543154-76ec1c4257df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxlbnRyZXByZW5ldXIlMjBtYW4lMjBwb3J0cmFpdCUyMGhlYWRzaG90fGVufDF8fHx8MTc3MTcxNTM3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

type TestimonialItem = Omit<FeatureTestimotionalProps, "className">;

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

export const defaultContentFeatureFindTestimotionalsProps = {
  eyebrow: "Testimonials",
  title: "Trusted by teams worldwide",
  testimonials: [
    {
      avatar: avatar1Url,
      name: "James Carter",
      role: "CTO, TechFlow",
      text: "The modular architecture saved us months of development. We shipped our MVP with ecommerce and blog fully integrated in just two weeks.",
      rating: 5,
    },
    {
      avatar: avatar2Url,
      name: "Sarah Kim",
      role: "Product Lead, NovaBridge",
      text: "Having 15 modules out of the box means we focus on business logic, not infrastructure. The RBAC system alone replaced our custom auth layer.",
      rating: 4,
    },
    {
      avatar: avatar3Url,
      name: "Marcus Webb",
      role: "Founder, LaunchPad.io",
      text: "The admin panel is incredibly intuitive. Our content team manages products, articles, and notifications without any developer involvement.",
      rating: 5,
    },
  ] satisfies TestimonialItem[],
};

export type ContentFeatureFindTestimotionalsProps =
  typeof defaultContentFeatureFindTestimotionalsProps;

export function ContentFeatureFindTestimotionals(
  props?: Partial<ContentFeatureFindTestimotionalsProps>,
) {
  const { eyebrow, title, testimonials } = {
    ...defaultContentFeatureFindTestimotionalsProps,
    ...props,
  };

  return (
    <div
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-feature-find-testimotionals"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          data-ds-imports="website-builder.feature.testimotional"
        >
          {testimonials.map((testimonial) => (
            <WebsiteBuilderModuleFeature
              key={testimonial.name}
              {...testimonial}
              variant="testimotional"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
