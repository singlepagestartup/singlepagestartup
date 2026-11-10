import { createHash, timingSafeEqual } from "node:crypto";
import { validateWebhookIdentifiers } from "../webhook-identifiers";

export interface IVerifiedPaykeeperWebhook {
  id: string;
  orderid: string;
  clientid: string;
  amountInMinorUnits: number;
  acknowledgment: string;
}

export interface IVerifyPaykeeperWebhookProps {
  data: unknown;
  secret: string | undefined;
}

export function paykeeperAmountInMinorUnits(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value))
    throw new Error("Validation error. Invalid PayKeeper amount");
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount))
    throw new Error("Validation error. Invalid PayKeeper amount");
  return amount;
}

export function verifyPaykeeperWebhook(
  props: IVerifyPaykeeperWebhookProps,
): IVerifiedPaykeeperWebhook {
  if (!props.secret)
    throw new Error("Configuration error. Paykeeper webhook secret not found");
  const fields = validateWebhookIdentifiers({
    data: props.data,
    uuidFields: ["orderid"],
    stringFields: ["id", "sum", "clientid"],
  });
  if (!fields.id || !/^\d+$/.test(fields.id))
    throw new Error("Validation error. Invalid id");
  if (!fields.sum) throw new Error("Validation error. Invalid sum");
  const amountInMinorUnits = paykeeperAmountInMinorUnits(fields.sum);
  const sum = `${Math.floor(amountInMinorUnits / 100)}.${String(amountInMinorUnits % 100).padStart(2, "0")}`;
  const clientid = fields.clientid ?? "";
  const key = (props.data as Record<string, unknown>).key;
  const digest = createHash("md5")
    .update(fields.id + sum + clientid + fields.orderid + props.secret, "utf8")
    .digest();
  if (
    typeof key !== "string" ||
    !/^[a-f\d]{32}$/i.test(key) ||
    !timingSafeEqual(digest, Buffer.from(key, "hex"))
  )
    throw new Error("Permission error. Invalid PayKeeper webhook signature");
  return {
    id: fields.id,
    orderid: fields.orderid,
    clientid,
    amountInMinorUnits,
    acknowledgment:
      "OK " +
      createHash("md5")
        .update(fields.id + props.secret, "utf8")
        .digest("hex"),
  };
}
