import Link from "next/link";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";
export function Component({
  variant = "brand-ai-chat",
  language = "en",
  data,
}: IComponentPropsExtended) {
  const pathname = `/${language}`;
  return (
    <Link
      href={getLocalizedHref(pathname, "/")}
      data-ds-block="website-builder.logotype.brand-ai-chat"
      data-id={data.id}
      className={`group relative isolate inline-flex shrink-0 items-center gap-3 rounded-xl ${kit.focus}`}
      aria-label="SPS AI Chat home"
      data-module="website-builder"
      data-model="logotype"
      data-variant={variant}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 -z-10 rounded-full bg-linear-to-r from-primary via-primary/30 to-muted opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />
      <img
        src="/images/ai-chat/operator-logo-square-black.svg"
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-focus-visible:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none"
      />
      <span className="text-lg font-semibold tracking-tight">
        sps{" "}
        <span className="text-muted-foreground transition-colors group-hover:text-foreground group-focus-visible:text-foreground motion-reduce:transition-none">
          ai chat
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-3 -top-2 scale-50 text-primary opacity-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      >
        <Icon name="star" className="size-4" />
      </span>
    </Link>
  );
}
const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const kit = {
  focus: focus,
};
