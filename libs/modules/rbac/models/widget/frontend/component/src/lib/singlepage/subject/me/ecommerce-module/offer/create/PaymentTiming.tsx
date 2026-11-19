interface IPaymentTimingProps {
  afterAcceptance?: boolean;
  onChange?: (afterAcceptance: boolean) => void;
}

export function PaymentTiming({
  afterAcceptance = false,
  onChange,
}: IPaymentTimingProps) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      When the customer pays
      <select
        name="paymentTiming"
        className="min-h-11 rounded-xl border border-input bg-background px-3 py-2"
        defaultValue={afterAcceptance ? "after-acceptance" : "in-cart"}
        onChange={(event) =>
          onChange?.(event.target.value === "after-acceptance")
        }
      >
        <option value="in-cart">At checkout</option>
        <option value="after-acceptance">After accepting the result</option>
      </select>
      <span className="text-xs font-normal text-muted-foreground">
        The customer orders a postpaid service separately. Publish an
        individual-service funnel for this offer to open the order discussion.
      </span>
    </label>
  );
}
