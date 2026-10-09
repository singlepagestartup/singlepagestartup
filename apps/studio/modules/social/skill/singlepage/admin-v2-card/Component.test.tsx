import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as SocialModuleSkill } from "../../index";
import fixture from "../admin-v2-table/data.json";

test("public card entry resolves the selected local record", () => {
  const html = renderToStaticMarkup(
    <SocialModuleSkill variant="admin-v2-card" id={fixture.records[1].id} />,
  );
  expect(html).toContain(fixture.records[1].id);
  expect(html).toContain("skill example 2");
  expect(html).not.toContain("skill example 1");
});

test("an unknown record does not silently display the first fixture", () => {
  const html = renderToStaticMarkup(
    <SocialModuleSkill variant="admin-v2-card" id="missing" />,
  );
  expect(html).toContain("Record unavailable");
  expect(html).not.toContain(fixture.records[0].id);
});
