import { Button } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowRight,
  ShoppingCart,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface ProductOverviewCtaProps {
  title: string;
  description?: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  secondaryHref: string;
  blockId?: string;
  importedBlockId?: string;
  onPrimaryAction?: () => void;
}

export const defaultProductOverviewCtaProps: ProductOverviewCtaProps = {
  title: "Ready to build your website?",
  description: "Get a free consultation and project estimate within 24 hours.",
  primaryActionLabel: "Add to cart",
  secondaryActionLabel: "Book a call",
  secondaryHref: "/#contact",
};

export function ProductOverviewCta(props?: Partial<ProductOverviewCtaProps>) {
  const {
    title,
    description,
    primaryActionLabel,
    secondaryActionLabel,
    secondaryHref,
    blockId,
    importedBlockId,
    onPrimaryAction,
  } = { ...defaultProductOverviewCtaProps, ...props };

  return (
    <section
      className="w-full py-12 sm:py-16"
      data-ds-block={blockId ?? "ecommerce.product.overview-cta"}
      data-ds-imports={importedBlockId}
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 rounded-3xl bg-[var(--workspace-brand-primary)] p-6 text-[var(--workspace-brand-on-primary)] sm:p-10 lg:flex-row lg:items-end lg:justify-between lg:p-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--workspace-brand-muted-on-primary)]">
                {description}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              onClick={onPrimaryAction}
              disabled={!onPrimaryAction}
              className="focus-visible:outline-[var(--workspace-brand-focus-inverse)]"
            >
              <ShoppingCart className="h-5 w-5" />
              {primaryActionLabel}
            </Button>
            <a
              href={secondaryHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--workspace-brand-muted-on-primary)]/50 px-5 py-2 text-sm font-semibold text-[var(--workspace-brand-on-primary)] transition hover:bg-[var(--workspace-brand-on-primary)]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus-inverse)]"
            >
              {secondaryActionLabel}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
