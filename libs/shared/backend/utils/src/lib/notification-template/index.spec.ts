import {
  interpolateNotificationTemplate,
  getNotificationTemplateChannel,
} from ".";

describe("saved notification content", () => {
  it("substitutes scalar variables and treats all markup as text", () => {
    const result = interpolateNotificationTemplate({
      content:
        "<script>alert(1)</script>\n{{project}}: {{counts.failed}} / {{ok}}",
      payload: { project: "<img src=x>", counts: { failed: 0 }, ok: false },
    });
    expect(result).toBe("<script>alert(1)</script>\n<img src=x>: 0 / false");
  });

  it.each([
    "{{missing}}",
    "{{constructor}}",
    "{{__proto__.value}}",
    "{{nested}}",
    "{{toString}}",
  ])("rejects missing, object or inherited values: %s", (content) => {
    expect(() =>
      interpolateNotificationTemplate({
        content,
        payload: { nested: {} },
      }),
    ).toThrow("Validation error.");
  });

  it("rejects empty and oversized content", () => {
    for (const content of [" ", "x".repeat(32001)]) {
      expect(() => interpolateNotificationTemplate({ content })).toThrow(
        "Validation error.",
      );
    }
  });

  it("stops repeated substitutions before allocating an oversized message", () => {
    expect(() =>
      interpolateNotificationTemplate({
        content: "{{value}}".repeat(100),
        payload: { value: "x".repeat(32000) },
      }),
    ).toThrow("Rendered template is too large");
  });
});

describe("notification template channels", () => {
  it.each([
    ["content-email", "email"],
    ["project-security-email", "email"],
    ["project-security-telegram", "telegram"],
    ["reset-password", "email"],
    ["default", null],
    ["email-telegram", null],
  ])(
    "resolves %s without coupling delivery to content variants",
    (variant, channel) => {
      expect(getNotificationTemplateChannel(variant as string)).toBe(channel);
    },
  );
});
