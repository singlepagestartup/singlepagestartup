/**
 * BDD Suite: external webhook identifier validation.
 *
 * Given: an untrusted payload and explicit UUID/string field contracts.
 * When: identifiers are validated before a provider lookup.
 * Then: invalid shapes/types are rejected without echoing submitted values, and supported identifiers are preserved.
 */
import {
  validateWebhookIdentifiers,
  getHttpErrorType,
} from "@sps/backend-utils";

const orderid = "8f1c0d4e-0b24-4f8c-9a9f-2cf0d3c1a111";
const validate = (data: unknown) =>
  validateWebhookIdentifiers({
    data,
    uuidFields: ["orderid"],
    stringFields: ["id", "sum", "clientid"],
  });

it.each([undefined, null, [], "payload", 42, true, new Date()])(
  "rejects a non-object payload (%p) with a validation error",
  (data) =>
    expect(() => validate(data)).toThrow(
      "Validation error. Invalid webhook payload",
    ),
);

it.each([
  undefined,
  null,
  "",
  "not-a-uuid",
  " 8f1c0d4e-0b24-4f8c-9a9f-2cf0d3c1a111 ",
  42,
  {},
  [],
])("rejects an invalid UUID value (%p)", (value) =>
  expect(() => validate({ orderid: value })).toThrow(
    "Validation error. Invalid orderid",
  ),
);

it.each(["id", "sum", "clientid"])(
  "rejects a structured %s without echoing its value",
  (field) => {
    try {
      validate({ orderid, [field]: { privateValue: "do-not-echo" } });
      throw new Error("Validation unexpectedly succeeded");
    } catch (error) {
      const mapped = getHttpErrorType(error as Error);
      expect(mapped.status).toBe(400);
      expect(mapped.message).toBe(`Validation error. Invalid ${field}`);
      expect(mapped.message).not.toContain("do-not-echo");
    }
  },
);

it("preserves UUID case, string values and an empty optional value while ignoring unrelated fields", () => {
  expect(
    validate({
      orderid: orderid.toUpperCase(),
      id: "301",
      sum: "100.00",
      clientid: "",
      other: "unused",
    }),
  ).toEqual({
    orderid: orderid.toUpperCase(),
    id: "301",
    sum: "100.00",
    clientid: "",
  });
});

it("accepts absent/null optional values and a payload with no prototype", () => {
  expect(validate({ orderid, id: null })).toEqual({ orderid });
  expect(validate(Object.assign(Object.create(null), { orderid }))).toEqual({
    orderid,
  });
});
