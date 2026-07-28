import { useState } from "react";
import { CheckCircle2, Minus, Package, Plus, ShoppingCart } from "lucide-react";

const IMG_WEB =
  "https://images.unsplash.com/photo-1665554306521-86afb5cb008a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXZlbG9wbWVudCUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzE3MTY2NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

export interface ProductOverviewPurchaseProps {
  id: string;
  slug: string;
  image: string;
  title: string;
  priceLabel: string;
  price: number;
  priceNote: string;
  deliverables: string[];
  techStack: string[];
  onAddToCart?: (
    item: {
      id: string;
      slug: string;
      title: string;
      priceLabel: string;
      price: number;
      image: string;
    },
    quantity: number,
  ) => void;
  blockId?: string;
  importedBlockId?: string;
}

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

export function ProductOverviewPurchase(
  props?: Partial<ProductOverviewPurchaseProps>,
) {
  const {
    id,
    slug,
    image,
    title,
    priceLabel,
    price,
    priceNote,
    deliverables,
    techStack,
    onAddToCart,
    blockId,
    importedBlockId,
  } = {
    ...defaultProductOverviewPurchaseProps,
    ...props,
  };
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

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
    window.setTimeout(() => setIsAdded(false), 1600);
  }

  return (
    <section
      className="w-full bg-white py-10"
      data-ds-block={blockId ?? "ecommerce.product.overview-purchase"}
      data-ds-imports={importedBlockId}
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl text-slate-900">{priceLabel}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{priceNote}</p>

              <div className="mt-5">
                <label className="mb-1.5 block text-xs text-slate-500">
                  Quantity / Licenses
                </label>
                <div className="flex items-center gap-0">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-l-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex h-10 w-12 items-center justify-center border-y border-slate-300 bg-white text-sm text-slate-900">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => value + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-r-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm transition ${
                  isAdded
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-400 bg-slate-900 text-white hover:bg-slate-800"
                }`}
                onClick={handleAddToCart}
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm text-slate-900">
                <Package className="h-4 w-4 text-slate-400" />
                What You Get
              </h3>
              <ul className="space-y-2">
                {deliverables.map((deliverable) => (
                  <li
                    key={deliverable}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm text-slate-900">Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
