/**
 * BDD Suite: PayKeeper signature and acknowledgment protocol.
 * Given: a callback signed with the merchant seed and decimal payment amount.
 * When: the callback is authenticated.
 * Then: only the matching digest is accepted and the provider acknowledgment is deterministic.
 */
import {
  verifyPaykeeperWebhook,
  paykeeperAmountInMinorUnits,
} from "@sps/backend-utils";

const data = {
  id: "301",
  sum: "100.00",
  clientid: "Иван Иванов",
  orderid: "8f1c0d4e-0b24-4f8c-9a9f-2cf0d3c1a111",
  key: "b8d192e39e07d12002b575f49a846e8c",
};
const verify = (input: unknown, secret: string | undefined = "test-seed") =>
  verifyPaykeeperWebhook({ data: input, secret });

it("authenticates a UTF-8 callback and generates the expected acknowledgment", () => {
  const event = verify(data);
  expect(event.amountInMinorUnits).toBe(10000);
  expect(event.acknowledgment).toBe("OK 5d752a1d928c8fe77dd71f0f16a70033");
});
it.each(["100", "100.0", "0100.00"])(
  "normalizes %s to two decimal places for the signature",
  (sum) => {
    expect(verify({ ...data, sum }).amountInMinorUnits).toBe(10000);
  },
);
it.each(["id", "sum", "clientid", "orderid"])(
  "rejects tampering with signed %s",
  (field) => {
    const values = {
      id: "302",
      sum: "100.01",
      clientid: "Другой клиент",
      orderid: "9f1c0d4e-0b24-4f8c-9a9f-2cf0d3c1a111",
    };
    expect(() =>
      verify({ ...data, [field]: values[field as keyof typeof values] }),
    ).toThrow("Permission error. Invalid PayKeeper webhook signature");
  },
);
it.each([undefined, null, "", "bad", "g".repeat(32), "0".repeat(32)])(
  "rejects a missing or forged digest (%p)",
  (key) => {
    expect(() => verify({ ...data, key })).toThrow(
      "Permission error. Invalid PayKeeper webhook signature",
    );
  },
);
it("fails closed without a configured seed and accepts uppercase digest hex", () => {
  expect(() => verifyPaykeeperWebhook({ data, secret: undefined })).toThrow(
    "Configuration error",
  );
  expect(verify({ ...data, key: data.key.toUpperCase() }).id).toBe("301");
});
it.each([
  "1e2",
  "-1.00",
  "100.001",
  "Infinity",
  "NaN",
  " 100.00",
  "9007199254740992",
])("rejects an unsafe amount (%s)", (sum) => {
  expect(() => paykeeperAmountInMinorUnits(sum)).toThrow("Validation error");
});
it("retains cents exactly", () =>
  expect(paykeeperAmountInMinorUnits("1205.98")).toBe(120598));
