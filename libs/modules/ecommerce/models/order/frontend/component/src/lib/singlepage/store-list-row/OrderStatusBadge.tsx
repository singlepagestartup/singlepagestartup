import { orderStatusLabel } from "@sps/ecommerce/models/order/sdk/model";

interface IOrderStatusBadgeProps {
  status: string;
  language: string;
  label?: string;
}

export function OrderStatusBadge({
  status,
  language,
  label,
}: IOrderStatusBadgeProps) {
  const success = ["paid", "delivered", "completed"].includes(status);
  const awaiting = [
    "awaiting-payment",
    "open",
    "paying",
    "approving",
    "pending",
    "requested_cancelation",
    "canceling",
  ].includes(status);
  let tone = "bg-muted text-muted-foreground";
  if (
    [
      "new",
      "preparing",
      "awaiting-result",
      "packaging",
      "delivering",
      "in-transit",
    ].includes(status)
  )
    tone = "bg-sky-100 text-sky-900";
  if (["failed", "uncollectible", "expired"].includes(status))
    tone = "bg-red-100 text-red-900";
  if (success) tone = "bg-emerald-100 text-emerald-900";
  if (awaiting) tone = "bg-amber-100 text-amber-950";

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs leading-4 font-medium ${tone}`}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-full bg-current"
      />
      {label ?? orderStatusLabel(status, language)}
    </span>
  );
}
