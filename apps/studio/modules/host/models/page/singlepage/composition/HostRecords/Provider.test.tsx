import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HostStudioProvider, HostModelForm, HostWorkbench } from "./index";
import { createHostStudioState } from "../../../../../../../workspace/utils/host-studio/index";

test("Host forms and navigation show models without relation management", () => {
  const state = createHostStudioState();
  const html = renderToStaticMarkup(
    <HostStudioProvider initialState={state}>
      <HostModelForm model="page" record={state.models.page[0]} />
      <HostWorkbench />
    </HostStudioProvider>,
  );
  expect(html).toContain("Studio journal");
  expect(html).toContain("Host views");
  expect(html).not.toContain("Connected records");
  expect(html).not.toContain("pages-to-layouts");
});
