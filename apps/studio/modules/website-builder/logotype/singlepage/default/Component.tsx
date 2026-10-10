import { BrandMark } from "../../../../../workspace/utils/components/BrandMark";

export interface ILogotypeDefaultProps {
  brand?: string;
  compact?: boolean;
}
export function Component({
  brand = "SinglePageStartup",
  compact = false,
}: ILogotypeDefaultProps = {}) {
  return (
    <a
      data-ds-block="website-builder.logotype.default"
      href="/?path=/story/modules-host-models-page-singlepage-root--default"
      target="_top"
      aria-label={`${brand} home`}
      className="inline-flex min-h-11 items-center gap-3 rounded-xl text-base font-semibold text-[var(--workspace-brand-foreground)] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)]"
    >
      <BrandMark size={compact ? "sm" : undefined} />
      <span className={compact ? "sr-only" : "hidden min-[480px]:inline"}>
        {brand}
      </span>
    </a>
  );
}
