/**
 * website-builder.feature.dropdown
 *
 * Single expandable feature item (native <details> disclosure). Owned by the
 * website-builder module (model: feature). Accordion-style widgets such as
 * content-faq compose a list of these instead of re-implementing the markup.
 * Presentation-only — uses the native <details>/<summary> toggle, no JS.
 */
import { ChevronDown } from "lucide-react";

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
      className="group border-b border-slate-100 last:border-0"
      open={open}
      data-ds-block="website-builder.feature.dropdown"
      data-ds-layer="singlepage"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm text-slate-900 hover:bg-slate-50">
        {question}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="px-4 pb-4 text-sm text-slate-600">{answer}</p>
    </details>
  );
}
