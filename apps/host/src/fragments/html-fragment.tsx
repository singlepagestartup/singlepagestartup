import { FragmentRenderedSlot } from "@sps/shared-fragments";

export function HtmlFragment(props: { html: string; className?: string }) {
  if (!props.html) {
    return null;
  }

  return (
    <div
      className={props.className}
      data-sps-fragment
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}

export function mergeSlotHtml(slots: FragmentRenderedSlot[] = []) {
  return slots.map((slot) => slot.html).join("");
}
