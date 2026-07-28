import { Star } from "lucide-react";

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
  eyebrow: "Client Feedback",
  title: "What Clients Say",
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
      className="w-full py-16 border-y border-slate-200 bg-white"
      data-ds-block="website-builder.widget.content-testimonials"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
              {eyebrow}
            </p>
            <h2 className="text-2xl tracking-tight text-slate-900">{title}</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="h-full rounded-xl border border-slate-200 bg-[#eaf0f7] p-6"
            >
              <div className="mb-3 flex gap-0.5" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm leading-6 text-slate-600">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                />
                <div>
                  <p className="text-sm text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
