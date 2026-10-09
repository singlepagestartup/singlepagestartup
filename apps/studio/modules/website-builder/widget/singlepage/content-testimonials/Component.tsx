import { FeatureTestimotional } from "../../../feature/singlepage/testimotional/Component";

export interface ContentTestimonialItem {
  avatar: string;
  name: string;
  role: string;
  text: string;
}

const IMG = {
  avatar1:
    "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MTY2ODA0OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  avatar2:
    "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzcxNjEyNDc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

export const defaultContentTestimonialsProps = {
  eyebrow: "Client feedback",
  title: "What clients say",
  testimonials: [
    {
      avatar: IMG.avatar1,
      name: "James Carter",
      role: "CTO, TechFlow",
      text: "Delivered ahead of schedule with exceptional quality. The team understood our vision from day one.",
    },
    {
      avatar: IMG.avatar2,
      name: "Sarah Kim",
      role: "Product Lead, NovaBridge",
      text: "Transformed our outdated platform into a modern, scalable solution. ROI was visible within the first month.",
    },
  ] satisfies ContentTestimonialItem[],
};

export type ContentTestimonialsProps = typeof defaultContentTestimonialsProps;

export function ContentTestimonials(props?: Partial<ContentTestimonialsProps>) {
  const { eyebrow, title, testimonials } = {
    ...defaultContentTestimonialsProps,
    ...props,
  };

  return (
    <section
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-testimonials"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-[var(--workspace-brand-foreground)]">
              {title}
            </h2>
          </div>
        </div>
        <div
          className="grid gap-4 md:grid-cols-2"
          data-ds-imports="website-builder.feature.testimotional"
        >
          {testimonials.map((t) => (
            <FeatureTestimotional key={t.name} {...t} rating={5} />
          ))}
        </div>
      </div>
    </section>
  );
}
