import type { IComponentProps, ILogotypeDefaultProps } from "./interface";
export type { ILogotypeDefaultProps } from "./interface";
interface BrandMarkProps {
  size?: "sm" | "md";
  inverse?: boolean;
}
function BrandMark({ size = "md", inverse = false }: BrandMarkProps) {
  return (
    <img
      aria-hidden="true"
      alt=""
      className={`block shrink-0 object-contain ${size === "sm" ? "size-6" : "size-8"}`}
      src={inverse ? darkMark : lightMark}
    />
  );
}

export function Component({
  variant = "default",
  brand = "SinglePageStartup",
  compact = false,
}: IComponentProps = {}) {
  return (
    <a
      data-ds-block="website-builder.logotype.default"
      href="/?path=/story/modules-host-models-page-singlepage-framework--default"
      target="_top"
      aria-label={`${brand} Framework`}
      className="inline-flex min-h-11 items-center gap-3 rounded-xl text-base font-semibold text-foreground no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
      data-module="website-builder"
      data-model="logotype"
      data-variant={variant}
    >
      <BrandMark size={compact ? "sm" : undefined} />
      <span className={compact ? "sr-only" : "hidden min-[480px]:inline"}>
        {brand}
      </span>
    </a>
  );
}
const lightMark =
  "/module-assets/images/singlepage/intake/operator-logo-square-white.svg";
const darkMark =
  "/module-assets/images/singlepage/intake/operator-logo-square-black.svg";
