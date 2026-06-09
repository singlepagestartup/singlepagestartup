import { Link } from "react-router";
import {
  X,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Package,
} from "lucide-react";
import { useCart } from "./CartContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "./ui/sheet";

export function CartDrawer() {
  const {
    items,
    isOpen,
    close,
    removeItem,
    updateQty,
    itemCount,
    total,
    clearCart,
  } = useCart();

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 gap-0 [&>button.absolute]:hidden sm:max-w-md"
      >
        <SheetTitle className="sr-only">Shopping Cart</SheetTitle>
        <SheetDescription className="sr-only">
          Your shopping cart
        </SheetDescription>

        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-900">Cart</span>
            {itemCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] text-white">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
              <Package className="h-7 w-7 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-900">Your cart is empty</p>
              <p className="mt-1 text-xs text-slate-500">
                Browse our services and add something you like.
              </p>
            </div>
            <Link
              to="/services"
              onClick={close}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Browse Services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-100 px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  {/* Thumbnail */}
                  <Link
                    to={`/services/${item.slug}`}
                    onClick={close}
                    className="shrink-0 overflow-hidden rounded-lg border border-slate-200"
                  >
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="h-20 w-20 object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/services/${item.slug}`}
                        onClick={close}
                        className="text-sm text-slate-900 transition hover:text-slate-600"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="mt-0.5 text-xs text-slate-500">
                      {item.priceLabel}
                    </span>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      {/* Quantity controls */}
                      <div className="flex items-center gap-0">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-l-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <div className="flex h-7 w-8 items-center justify-center border-y border-slate-300 bg-white text-xs text-slate-900">
                          {item.qty}
                        </div>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-r-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="text-sm text-slate-900">
                        ${(item.price * item.qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 px-6 py-5">
            {/* Totals */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Consultation discount</span>
                <span className="text-emerald-600">-10%</span>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-900">Total</span>
                  <span className="text-lg text-slate-900">
                    ${Math.round(total * 0.9).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <Link
              to="/checkout"
              onClick={close}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-3 text-sm text-white transition hover:bg-slate-800"
            >
              <ShoppingCart className="h-4 w-4" />
              Proceed to Checkout
            </Link>
            <button
              onClick={clearCart}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              Clear Cart
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
