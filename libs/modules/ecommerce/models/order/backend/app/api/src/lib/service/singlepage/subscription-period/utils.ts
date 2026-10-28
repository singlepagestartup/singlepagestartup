import type { IModel as IInvoice } from "@sps/billing/models/invoice/sdk/model";

export function intervalEnd(startsAt: Date, interval: string): Date {
  const end = new Date(startsAt);
  if (!Number.isFinite(end.getTime()))
    throw new Error("Validation error. Invalid subscription period start");
  switch (interval) {
    case "minute":
      end.setMinutes(end.getMinutes() + 1);
      break;
    case "hour":
      end.setHours(end.getHours() + 1);
      break;
    case "day":
      end.setDate(end.getDate() + 1);
      break;
    case "week":
      end.setDate(end.getDate() + 7);
      break;
    case "month":
      end.setMonth(end.getMonth() + 1);
      break;
    case "year":
      end.setFullYear(end.getFullYear() + 1);
      break;
    default:
      throw new Error("Validation error. Unsupported subscription interval");
  }
  return end;
}

export function compareInvoices(
  left: Pick<IInvoice, "id" | "createdAt">,
  right: Pick<IInvoice, "id" | "createdAt">,
): number {
  const leftTime = new Date(left.createdAt).getTime();
  const rightTime = new Date(right.createdAt).getTime();
  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime))
    throw new Error("Validation error. Invalid invoice creation date");
  return (
    leftTime - rightTime ||
    (left.id > right.id ? 1 : left.id < right.id ? -1 : 0)
  );
}
