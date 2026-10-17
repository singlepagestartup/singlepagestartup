import type {
  IComponentProps,
  ProductOverviewPurchaseProps,
} from "./interface";
export type { ProductOverviewPurchaseProps } from "./interface";

import { Component as SharedIcon } from "../../../../shared/icon";

import {
  forwardRef,
  type SVGProps,
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useEffect,
  useRef,
  useState,
} from "react";
import { twMerge as twMerge } from "tailwind-merge";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import type IconGlyphs from "../../../../shared/icon/singlepage/phosphor/icons.json";
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export function ProductOverviewPurchase(props?: IComponentProps) {
  const {
    id,
    slug,
    image,
    title,
    priceLabel,
    price,
    priceNote,
    deliverables,
    onAddToCart,
    blockId,
    importedBlockId,
  } = {
    ...defaultProductOverviewPurchaseProps,
    ...props,
  };
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const feedbackTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (feedbackTimer.current !== null)
        window.clearTimeout(feedbackTimer.current);
    },
    [],
  );
  function handleAddToCart() {
    onAddToCart?.(
      {
        id,
        slug,
        title,
        priceLabel,
        price,
        image,
      },
      quantity,
    );
    setIsAdded(true);
    if (feedbackTimer.current !== null)
      window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setIsAdded(false), 1600);
  }
  return (
    <section
      id="product-purchase"
      className="w-full scroll-mt-24 py-8 sm:py-12"
      data-ds-block={blockId ?? "ecommerce.product.overview-purchase"}
      data-ds-imports={importedBlockId}
      data-ds-layer="singlepage"
      data-module="ecommerce"
      data-model="product"
      data-variant={props?.variant ?? "overview-purchase"}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold text-muted-foreground">
            Your project
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Choose what you need.
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 overflow-hidden rounded-3xl bg-card">
            <div className="p-5 sm:p-8">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Package className="h-5 w-5" /> What you get
              </h3>
              <ul className="mt-5 grid gap-3">
                {deliverables.map((deliverable) => (
                  <li
                    key={deliverable}
                    className="flex items-start gap-3 text-base leading-6 text-muted-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex min-w-0 flex-col rounded-3xl border border-border bg-card p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-4">
              <img
                src={image}
                alt=""
                className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              />
              <p className="text-sm font-semibold text-muted-foreground">
                {title}
              </p>
            </div>
            <p className="mt-4 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              {priceLabel}
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {priceNote}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted p-4">
              <span className="text-sm font-semibold text-foreground">
                Quantity / licenses
              </span>
              <div
                role="group"
                aria-label="Quantity"
                className="flex items-center gap-1 rounded-xl bg-card p-1"
              >
                <Button
                  variant="plain"
                  aria-label="Decrease quantity"
                  className="h-11 w-11 px-0"
                  disabled={quantity === 1}
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <output
                  aria-live="polite"
                  className="min-w-8 text-center text-sm font-semibold"
                >
                  {quantity}
                </output>
                <Button
                  variant="plain"
                  aria-label="Increase quantity"
                  className="h-11 w-11 px-0"
                  onClick={() => setQuantity((value) => value + 1)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <Button
              className="mt-5 w-full"
              onClick={handleAddToCart}
              disabled={isAdded}
            >
              {isAdded ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
              {isAdded ? "Added to cart" : "Add to cart"}
            </Button>
            <span role="status" className="sr-only">
              {isAdded ? `${quantity} added to cart` : ""}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
const ShoppingCart = createIcon("shopping-cart");
const Plus = createIcon("plus");
const Package = createIcon("package");
const Minus = createIcon("minus");
const CheckCircle2 = createIcon("check-circle");
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
const IMG_WEB =
  "/module-assets/images/singlepage/generated/living-focus/singlepagestartup-photography-business-conversation-square.png";
export const defaultProductOverviewPurchaseProps: ProductOverviewPurchaseProps =
  {
    id: "srv-web",
    slug: "website-development",
    image: IMG_WEB,
    title: "Website Development",
    priceLabel: "from $4,999",
    price: 4999,
    priceNote: "Project-based pricing. Final quote after discovery call.",
    deliverables: [
      "Responsive website",
      "CMS setup",
      "SEO configuration",
      "Analytics integration",
      "Performance optimization",
      "Source code handoff",
    ],
    techStack: ["React", "Next.js", "Tailwind CSS", "TypeScript", "Vercel"],
  };
