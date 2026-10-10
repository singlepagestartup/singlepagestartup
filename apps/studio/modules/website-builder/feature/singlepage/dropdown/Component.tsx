/**
 * website-builder.feature.dropdown
 *
 * Single expandable feature item (native <details> disclosure). Owned by the
 * website-builder module (model: feature). Accordion-style widgets such as
 * content-faq compose a list of these instead of re-implementing the markup.
 * Presentation-only — uses the native <details>/<summary> toggle, no JS.
 */
import { ChevronDown } from "../../../../../workspace/utils/components/ModuleIcons";

export const defaultFeatureDropdownProps = {
  question: "What tech stack do you use?",
  answer:
    "We primarily use React / Next.js with Tailwind CSS, but we adapt to your existing stack if needed — Vue, Nuxt, Astro, or plain HTML/CSS.",
  open: true,
};

export type FeatureDropdownProps = typeof defaultFeatureDropdownProps;

export function FeatureDropdown(props?: Partial<FeatureDropdownProps>) {
  const { question, answer, open } = {
    ...defaultFeatureDropdownProps,
    ...props,
  };

  return (
    <details
      className="group min-w-0 border-b border-[var(--workspace-brand-line)] last:border-0"
      open={open}
      data-ds-block="website-builder.feature.dropdown"
      data-ds-layer="singlepage"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-5 text-base font-semibold leading-6 text-[var(--workspace-brand-foreground)] transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--workspace-brand-muted)] transition-transform duration-200 motion-reduce:transition-none group-open:rotate-180" />
      </summary>
      <p className="px-5 pb-6 pr-12 text-base leading-7 text-[var(--workspace-brand-muted)]">
        {answer}
      </p>
    </details>
  );
}
