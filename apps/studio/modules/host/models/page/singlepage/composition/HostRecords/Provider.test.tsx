import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HostStudioProvider, HostModelForm } from "./index";
import { createHostStudioState } from "../../../../../../../workspace/utils/host-studio/index";

test("Host forms render the relation manager supplied by their composition", () => {
  const state = createHostStudioState();
  const html = renderToStaticMarkup(
    <HostStudioProvider
      initialState={state}
      RelationManager={({ relation, ownerId }) => (
        <output>
          {relation}:{ownerId}
        </output>
      )}
    >
      <HostModelForm model="page" record={state.models.page[0]} />
    </HostStudioProvider>,
  );
  expect(html).toContain(`pages-to-layouts:${state.models.page[0].id}`);
  expect(html).toContain(`pages-to-metadata:${state.models.page[0].id}`);
});
