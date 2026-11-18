import { insertSchema, selectSchema } from "./index";

describe("extensible Product classification", () => {
  it.each([
    "physical",
    "digital",
    "service",
    "tax",
    "commission",
    "startup-membership",
  ])("accepts %s through the owning model schema", (kind) => {
    const input = insertSchema.parse({
      kind,
      slug: "example",
      adminTitle: "Example",
    });
    expect(input.kind).toBe(kind);
    expect(selectSchema.shape.kind.parse(kind)).toBe(kind);
  });

  it("keeps the database default and rejects an empty explicit classification", () => {
    expect(
      insertSchema.parse({ slug: "example", adminTitle: "Example" }).kind,
    ).toBeUndefined();
    expect(
      insertSchema.safeParse({
        kind: "  ",
        slug: "example",
        adminTitle: "Example",
      }).success,
    ).toBe(false);
  });
});
