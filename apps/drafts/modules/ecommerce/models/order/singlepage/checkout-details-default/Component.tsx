import { ArrowRight } from "lucide-react";

export interface OrderCheckoutDetailsField {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface OrderCheckoutDetailsDefaultProps {
  contactFields: OrderCheckoutDetailsField[];
  billingFields: OrderCheckoutDetailsField[];
  notesLabel: string;
  notesPlaceholder: string;
  actionLabel: string;
  actionDisabled?: boolean;
}

export const defaultOrderCheckoutDetailsDefaultProps: OrderCheckoutDetailsDefaultProps =
  {
    contactFields: [
      {
        id: "first-name",
        label: "First Name",
        placeholder: "John",
        required: true,
      },
      {
        id: "last-name",
        label: "Last Name",
        placeholder: "Doe",
        required: true,
      },
      {
        id: "email",
        label: "Email",
        placeholder: "john@example.com",
        required: true,
      },
      {
        id: "phone",
        label: "Phone",
        placeholder: "+1 (555) 000-0000",
      },
      {
        id: "company",
        label: "Company",
        placeholder: "Acme Inc.",
      },
    ],
    billingFields: [
      {
        id: "street-address",
        label: "Street Address",
        placeholder: "123 Main St",
      },
      {
        id: "city",
        label: "City",
        placeholder: "New York",
      },
      {
        id: "state",
        label: "State / Region",
        placeholder: "NY",
      },
      {
        id: "zip",
        label: "ZIP / Postal Code",
        placeholder: "10001",
      },
      {
        id: "country",
        label: "Country",
        placeholder: "United States",
      },
    ],
    notesLabel: "Additional Notes",
    notesPlaceholder: "Anything we should know about your project...",
    actionLabel: "Continue to Payment",
    actionDisabled: true,
  };

function CheckoutInput({ field }: { field: OrderCheckoutDetailsField }) {
  return (
    <div
      className={
        field.id === "company" || field.id === "street-address"
          ? "md:col-span-2"
          : ""
      }
    >
      <label
        className="mb-2 block text-base font-medium text-slate-500"
        htmlFor={field.id}
      >
        {field.label}
        {field.required ? <span className="ml-1 text-red-400">*</span> : null}
      </label>
      <input
        className="h-14 w-full rounded-xl border border-slate-300 bg-white px-5 text-xl text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
        id={field.id}
        placeholder={field.placeholder}
        readOnly
        type="text"
      />
    </div>
  );
}

export function OrderCheckoutDetailsDefault(
  props?: Partial<OrderCheckoutDetailsDefaultProps>,
) {
  const {
    contactFields,
    billingFields,
    notesLabel,
    notesPlaceholder,
    actionLabel,
    actionDisabled,
  } = {
    ...defaultOrderCheckoutDetailsDefaultProps,
    ...props,
  };

  return (
    <div
      className="space-y-8"
      data-ds-block="ecommerce.order.checkout-details-default"
      data-ds-layer="singlepage"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="mb-6 text-2xl font-medium text-slate-900">
          Contact Information
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {contactFields.map((field) => (
            <CheckoutInput field={field} key={field.id} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="mb-6 text-2xl font-medium text-slate-900">
          Billing Address
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {billingFields.map((field) => (
            <CheckoutInput field={field} key={field.id} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="mb-6 text-2xl font-medium text-slate-900">
          {notesLabel}
        </h2>
        <textarea
          className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-5 py-4 text-xl text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
          placeholder={notesPlaceholder}
          readOnly
        />
      </section>

      <button
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-400 bg-slate-900 px-6 py-5 text-xl text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={actionDisabled}
        type="button"
      >
        {actionLabel}
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
