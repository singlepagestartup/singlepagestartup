import { ArrowRight } from "lucide-react";
import { ButtonsArrayDefault } from "../../../buttons-array/singlepage/default/Component";
import { FeatureDropdown } from "../../../feature/singlepage/dropdown/Component";

export interface ContentFaqItem {
  q: string;
  a: string;
}

export const defaultContentFaqProps = {
  eyebrow: "FAQ",
  title: "Frequently Asked Questions",
  description:
    "Can't find the answer you're looking for? Reach out to our team and we'll get back to you within 24 hours.",
  contactHref: "/#contact",
  faq: [
    {
      q: "What tech stack do you use?",
      a: "We primarily use React / Next.js with Tailwind CSS, but we adapt to your existing stack if needed — Vue, Nuxt, Astro, or plain HTML/CSS.",
    },
    {
      q: "How long does a typical project take?",
      a: "A standard marketing website takes 4-6 weeks. Complex portals with CMS and integrations can take 8-12 weeks.",
    },
    {
      q: "Do you provide hosting?",
      a: "We recommend and set up hosting on Vercel, Netlify, or your preferred cloud provider. Hosting costs are separate.",
    },
    {
      q: "What about ongoing maintenance?",
      a: "We offer monthly maintenance packages starting at $299/mo covering updates, backups, and minor changes.",
    },
  ] satisfies ContentFaqItem[],
};

export type ContentFaqProps = typeof defaultContentFaqProps;

export function ContentFaq(props?: Partial<ContentFaqProps>) {
  const { eyebrow, title, description, contactHref, faq } = {
    ...defaultContentFaqProps,
    ...props,
  };

  return (
    <section
      className="w-full py-16"
      data-ds-block="website-builder.widget.content-faq"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
              {eyebrow}
            </p>
            <h2 className="text-2xl tracking-tight text-slate-900">{title}</h2>
            <p className="mt-3 text-sm text-slate-600">{description}</p>
            <div className="mt-5">
              <ButtonsArrayDefault
                ariaLabel="FAQ contact actions"
                buttons={[
                  {
                    href: contactHref,
                    icon: ArrowRight,
                    label: "Contact Us",
                    variant: "secondary",
                  },
                ]}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-1">
            {faq.map((item, idx) => (
              <FeatureDropdown
                key={idx}
                question={item.q}
                answer={item.a}
                open={idx === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
