import { ArrowRight } from "../../../../../../workspace/utils/components/ModuleIcons";
import { ButtonsArrayDefault } from "../../../buttons-array/singlepage/default/Component";
import { FeatureDropdown } from "../../../feature/singlepage/dropdown/Component";

export interface ContentFaqItem {
  q: string;
  a: string;
}

export const defaultContentFaqProps = {
  eyebrow: "FAQ",
  title: "Frequently asked questions",
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
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="website-builder.widget.content-faq"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-2 text-sm font-semibold tracking-normal text-[var(--workspace-brand-muted)]">
              {eyebrow}
            </p>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-normal sm:text-[2.5rem] text-[var(--workspace-brand-foreground)]">
              {title}
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[var(--workspace-brand-muted)]">
              {description}
            </p>
            <div className="mt-5">
              <ButtonsArrayDefault
                ariaLabel="FAQ contact actions"
                buttons={[
                  {
                    href: contactHref,
                    icon: ArrowRight,
                    label: "Contact us",
                    variant: "secondary",
                  },
                ]}
              />
            </div>
          </div>
          <div
            className="min-w-0 self-start rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2"
            data-ds-imports="website-builder.feature.dropdown"
          >
            {faq.map((item, idx) => (
              <FeatureDropdown
                key={item.q}
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
