import { renderNotificationTemplate } from ".";

describe("saved notification content", () => {
  it("substitutes scalar variables and treats all markup as text", () => {
    const result = renderNotificationTemplate({
      type: "email",
      content:
        "<script>alert(1)</script>\n{{project}}: {{counts.failed}} / {{ok}}",
      payload: { project: "<img src=x>", counts: { failed: 0 }, ok: false },
    });
    expect(result).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;<br>&lt;img src=x&gt;: 0 / false</p>",
    );
  });

  it("produces one Telegram sendMessage with escaped plain text", () => {
    const result = JSON.parse(
      renderNotificationTemplate({
        type: "telegram",
        content: "{{name}} & ok",
        payload: { name: "<b>name</b>" },
      }),
    );
    expect(result).toEqual({
      method: "sendMessage",
      props: ["&lt;b&gt;name&lt;/b&gt; &amp; ok", { parse_mode: "HTML" }],
    });
  });

  it.each([
    "{{missing}}",
    "{{constructor}}",
    "{{__proto__.value}}",
    "{{nested}}",
    "{{toString}}",
  ])("rejects missing, object or inherited values: %s", (content) => {
    expect(() =>
      renderNotificationTemplate({
        type: "email",
        content,
        payload: { nested: {} },
      }),
    ).toThrow("Validation error.");
  });

  it("rejects empty, oversized and multi-message content before transport", () => {
    for (const content of [" ", "x".repeat(32001)]) {
      expect(() =>
        renderNotificationTemplate({ type: "email", content }),
      ).toThrow("Validation error.");
    }
    expect(() =>
      renderNotificationTemplate({
        type: "telegram",
        content: "x".repeat(4001),
      }),
    ).toThrow("4000 characters");
  });

  it("stops repeated substitutions before allocating an oversized message", () => {
    expect(() =>
      renderNotificationTemplate({
        type: "email",
        content: "{{value}}".repeat(100),
        payload: { value: "x".repeat(32000) },
      }),
    ).toThrow("Rendered template is too large");
  });
});
