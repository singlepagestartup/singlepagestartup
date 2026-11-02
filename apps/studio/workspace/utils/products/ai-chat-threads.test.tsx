import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AIChatPreview } from "../../products/singlepage/ai-chat/website/Preview";

test("new profile identity is sufficient to prepare Products; profile IDs isolate model records", () => {
  const render = (id: string) =>
    renderToStaticMarkup(
      <AIChatPreview
        initialHref={`/ai-chat/social/profiles/${id}`}
        profiles={{
          initialProjects: [
            { id, name: "Empty project", variant: "scope-ai-chat-project" },
          ],
        }}
      />,
    );
  const first = render("first");
  const second = render("second");
  expect(first).toContain('data-id="first:products:products:thread:intro"');
  expect(first).not.toContain("second:products");
  expect(second).toContain('data-id="second:products:products:thread:intro"');
  expect(second).not.toContain("first:products");
  expect(first).not.toContain("Analyze materials");
});
