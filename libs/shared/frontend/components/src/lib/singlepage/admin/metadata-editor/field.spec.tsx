/** @jest-environment jsdom */
/** Given existing JSON sections, invalid editing must block submission without losing them. */
import { TextEncoder } from "node:util";
Object.assign(globalThis, { TextEncoder });
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { entityMetadataSchema } from "@sps/shared-utils/metadata";
import { MetadataField } from "./field";
const save = jest.fn();
function Form() {
  const form = useForm({
    resolver: zodResolver(z.object({ metadata: entityMetadataSchema })),
    defaultValues: {
      metadata: {
        campaign: { name: "keep" },
        seo: { title: { en: "Original" } },
      },
    },
  });
  return (
    <form onSubmit={form.handleSubmit(save)}>
      <MetadataField form={form} />
      <button>Save</button>
    </form>
  );
}
it("preserves adjacent sections when recovering from invalid JSON through the title field", async () => {
  render(<Form />);
  fireEvent.change(screen.getByLabelText("Metadata JSON"), {
    target: { value: "{" },
  });
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  expect(save).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("title"), {
    target: { value: "Updated" },
  });
  fireEvent.click(screen.getByText("Save"));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0][0].metadata).toEqual({
    campaign: { name: "keep" },
    seo: { title: { en: "Updated" } },
  });
});
