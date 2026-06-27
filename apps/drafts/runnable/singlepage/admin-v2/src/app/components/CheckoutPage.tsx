import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Minus,
  Plus,
  Building2,
  Wallet,
  Landmark,
  CircleDollarSign,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import { useCart, type CartItem } from "./CartContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";

/* ═══════════════════════════════════════════════════════════════════════
   Checkout steps
   ═══════════════════════════════════════════════════════════════════════ */

type Step = "details" | "payment" | "confirmation";

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: "details", label: "Details", num: 1 },
  { key: "payment", label: "Payment", num: 2 },
  { key: "confirmation", label: "Confirmation", num: 3 },
];

/* ═══════════════════════════════════════════════════════════════════════
   Small reusable pieces
   ═══════════════════════════════════════════════════════════════════════ */

function InputField({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  required,
  half,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  half?: boolean;
}) {
  return (
    <div className={half ? "flex-1" : ""}>
      <label htmlFor={id} className="mb-1.5 block text-xs text-slate-500">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Order summary sidebar (shared across steps)
   ═══════════════════════════════════════════════════════════════════════ */

function OrderSummary({
  items,
  itemCount,
  total,
  removeItem,
  updateQty,
  compact,
}: {
  items: CartItem[];
  itemCount: number;
  total: number;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  compact?: boolean;
}) {
  const discount = Math.round(total * 0.1);
  const finalTotal = total - discount;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm text-slate-900">Order Summary</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <ul className="divide-y divide-slate-100 px-5">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 py-4">
            <Link
              to={`/services/${item.slug}`}
              className="shrink-0 overflow-hidden rounded-lg border border-slate-200"
            >
              <ImageWithFallback
                src={item.image}
                alt={item.title}
                className="h-14 w-14 object-cover"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-sm text-slate-900">
                  {item.title}
                </span>
                {!compact && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded p-0.5 text-slate-400 transition hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                {compact ? (
                  <span className="text-xs text-slate-500">
                    Qty: {item.qty}
                  </span>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-l border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex h-6 w-7 items-center justify-center border-y border-slate-300 bg-white text-[11px] text-slate-900">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-r border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <span className="text-sm text-slate-900">
                  ${(item.price * item.qty).toLocaleString()}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <div className="space-y-2 border-t border-slate-100 px-5 py-4">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Subtotal</span>
          <span>${total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Consultation discount</span>
          <span className="text-emerald-600">
            -${discount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Tax</span>
          <span>$0</span>
        </div>
        <div className="border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-900">Total</span>
            <span className="text-lg text-slate-900">
              ${finalTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-t border-slate-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Lock className="h-3 w-3" /> SSL Secured
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <ShieldCheck className="h-3 w-3" /> Money-Back Guarantee
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 1 — Contact & Billing Details
   ═══════════════════════════════════════════════════════════════════════ */

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  notes: "",
};

function StepDetails({
  form,
  setForm,
  onNext,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
}) {
  const set = (key: keyof FormData) => (v: string) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const canProceed = form.firstName && form.lastName && form.email;

  return (
    <div className="space-y-6">
      {/* Contact */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm text-slate-900">Contact Information</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <InputField
              label="First Name"
              id="firstName"
              placeholder="John"
              value={form.firstName}
              onChange={set("firstName")}
              required
              half
            />
            <InputField
              label="Last Name"
              id="lastName"
              placeholder="Doe"
              value={form.lastName}
              onChange={set("lastName")}
              required
              half
            />
          </div>
          <div className="flex gap-4">
            <InputField
              label="Email"
              id="email"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={set("email")}
              required
              half
            />
            <InputField
              label="Phone"
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={set("phone")}
              half
            />
          </div>
          <InputField
            label="Company"
            id="company"
            placeholder="Acme Inc."
            value={form.company}
            onChange={set("company")}
          />
        </div>
      </section>

      {/* Billing address */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm text-slate-900">Billing Address</h3>
        <div className="space-y-4">
          <InputField
            label="Street Address"
            id="address"
            placeholder="123 Main St"
            value={form.address}
            onChange={set("address")}
          />
          <div className="flex gap-4">
            <InputField
              label="City"
              id="city"
              placeholder="New York"
              value={form.city}
              onChange={set("city")}
              half
            />
            <InputField
              label="State / Region"
              id="state"
              placeholder="NY"
              value={form.state}
              onChange={set("state")}
              half
            />
          </div>
          <div className="flex gap-4">
            <InputField
              label="ZIP / Postal Code"
              id="zip"
              placeholder="10001"
              value={form.zip}
              onChange={set("zip")}
              half
            />
            <InputField
              label="Country"
              id="country"
              placeholder="United States"
              value={form.country}
              onChange={set("country")}
              half
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm text-slate-900">Additional Notes</h3>
        <textarea
          id="notes"
          rows={3}
          placeholder="Anything we should know about your project..."
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
        />
      </section>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-3 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to Payment
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 2 — Payment
   ═══════════════════════════════════════════════════════════════════════ */

type PaymentMethod = "card" | "paypal" | "bank" | "crypto";

const METHODS: {
  key: PaymentMethod;
  label: string;
  icon: typeof CreditCard;
  desc: string;
}[] = [
  {
    key: "card",
    label: "Credit Card",
    icon: CreditCard,
    desc: "Visa, Mastercard, Amex",
  },
  {
    key: "paypal",
    label: "PayPal",
    icon: Wallet,
    desc: "Pay with PayPal balance",
  },
  {
    key: "bank",
    label: "Bank Transfer",
    icon: Landmark,
    desc: "Direct wire transfer",
  },
  {
    key: "crypto",
    label: "Crypto",
    icon: CircleDollarSign,
    desc: "BTC, ETH, USDT",
  },
];

function StepPayment({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onNext();
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Method selector */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm text-slate-900">Payment Method</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {METHODS.map((m) => {
            const active = method === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition ${
                  active
                    ? "border-slate-400 bg-slate-50 text-slate-900"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <m.icon className="h-5 w-5" />
                <span className="text-xs">{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Card form */}
      {method === "card" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm text-slate-900">Card Details</h3>
          <div className="space-y-4">
            <InputField
              label="Card Number"
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={setCardNumber}
              required
            />
            <InputField
              label="Name on Card"
              id="cardName"
              placeholder="John Doe"
              value={cardName}
              onChange={setCardName}
              required
            />
            <div className="flex gap-4">
              <InputField
                label="Expiry"
                id="expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={setExpiry}
                required
                half
              />
              <InputField
                label="CVC"
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={setCvc}
                required
                half
              />
            </div>
          </div>
        </section>
      )}

      {method === "paypal" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Wallet className="h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-600">
              You will be redirected to PayPal to complete payment.
            </p>
          </div>
        </section>
      )}

      {method === "bank" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-3 text-sm text-slate-900">Wire Transfer Details</h3>
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank</span>
              <span>Silicon Valley Bank</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account</span>
              <span className="font-mono">****-****-4821</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Routing</span>
              <span className="font-mono">121-000-248</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SWIFT</span>
              <span className="font-mono">SVBKUS6S</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Please include your order number as reference. Payment confirmation
            may take 1-3 business days.
          </p>
        </section>
      )}

      {method === "crypto" && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CircleDollarSign className="h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-600">
              After placing the order you'll receive a wallet address and
              payment instructions via email.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5">
                BTC
              </span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5">
                ETH
              </span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5">
                USDT
              </span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5">
                USDC
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Billing agreement */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-xs text-slate-500">
            I agree to the{" "}
            <a href="#" className="text-slate-700 underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-slate-700 underline">
              Privacy Policy
            </a>
            . All sales are subject to our refund policy.
          </span>
        </label>
      </section>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handlePay}
          disabled={processing}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-3 text-sm text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {processing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Place Order
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Step 3 — Confirmation
   ═══════════════════════════════════════════════════════════════════════ */

function StepConfirmation({ form, total }: { form: FormData; total: number }) {
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
  const finalTotal = Math.round(total * 0.9);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <PartyPopper className="h-7 w-7 text-emerald-600" />
        </div>
        <h2 className="text-xl text-slate-900">Thank you for your order!</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your order has been placed successfully. We'll send a confirmation to{" "}
          <span className="text-slate-900">{form.email || "your email"}</span>.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-sm text-slate-900">Order Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Order ID</span>
            <span className="font-mono text-slate-900">{orderId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Date</span>
            <span className="text-slate-900">
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount</span>
            <span className="text-slate-900">
              ${finalTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Status</span>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> Confirmed
            </span>
          </div>
          {form.company && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Company</span>
              <span className="text-slate-900">{form.company}</span>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="mb-3 text-sm text-slate-900">What Happens Next?</h3>
        <ol className="space-y-3">
          {[
            {
              title: "Confirmation Email",
              desc: "You'll receive an order confirmation and invoice within a few minutes.",
            },
            {
              title: "Discovery Call",
              desc: "Our team will reach out within 24 hours to schedule a kickoff meeting.",
            },
            {
              title: "Project Kickoff",
              desc: "We start working on your project according to the agreed timeline.",
            },
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-600">
                {i + 1}
              </span>
              <div>
                <p className="text-sm text-slate-900">{s.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex gap-3">
        <Link
          to="/services"
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Continue Shopping
        </Link>
        <Link
          to="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-400 bg-slate-900 px-4 py-3 text-sm text-white transition hover:bg-slate-800"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main Checkout Page
   ═══════════════════════════════════════════════════════════════════════ */

export function CheckoutPage() {
  const { items, itemCount, total, removeItem, updateQty, clearCart } =
    useCart();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const navigate = useNavigate();

  const stepIdx = STEPS.findIndex((s) => s.key === step);

  const handleConfirm = () => {
    setStep("confirmation");
    clearCart();
  };

  /* Empty cart + not on confirmation */
  if (items.length === 0 && step !== "confirmation") {
    return (
      <main className="flex-1">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <Building2 className="h-7 w-7 text-slate-400" />
          </div>
          <h1 className="text-xl text-slate-900">Your cart is empty</h1>
          <p className="mt-2 text-sm text-slate-500">
            Add some services to your cart before checking out.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Breadcrumb + title */}
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6">
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Link to="/" className="transition hover:text-slate-600">
              Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/services" className="transition hover:text-slate-600">
              Services
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">Checkout</span>
          </nav>
          <h1 className="text-2xl tracking-tight text-slate-900">Checkout</h1>

          {/* Stepper */}
          <div className="mt-6 flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = i < stepIdx;
              const active = s.key === step;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  {i > 0 && (
                    <div
                      className={`hidden h-px w-8 sm:block ${
                        done ? "bg-slate-400" : "bg-slate-200"
                      }`}
                    />
                  )}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                        done
                          ? "bg-slate-900 text-white"
                          : active
                            ? "border border-slate-400 bg-white text-slate-900"
                            : "border border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                    </span>
                    <span
                      className={`text-xs ${
                        active ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {step === "confirmation" ? (
          <div className="mx-auto max-w-2xl">
            <StepConfirmation form={form} total={total} />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left: form steps */}
            <div>
              {step === "details" && (
                <StepDetails
                  form={form}
                  setForm={setForm}
                  onNext={() => setStep("payment")}
                />
              )}
              {step === "payment" && (
                <StepPayment
                  onBack={() => setStep("details")}
                  onNext={handleConfirm}
                />
              )}
            </div>

            {/* Right: order summary */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <OrderSummary
                items={items}
                itemCount={itemCount}
                total={total}
                removeItem={removeItem}
                updateQty={updateQty}
                compact={step === "payment"}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
