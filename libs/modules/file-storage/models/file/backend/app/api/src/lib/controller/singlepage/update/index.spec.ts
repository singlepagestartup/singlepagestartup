/** Given an existing uploaded cover, changing alt/hidden must update it without uploading again. */
jest.mock("file-type", () => ({ fileTypeFromBuffer: jest.fn() }));
import { Handler } from "./index";
import { Hono } from "hono";
it("updates the existing File when PATCH contains only metadata", async () => {
  const service = {
    update: jest.fn(async ({ id, data }) => ({
      id,
      file: "/cover.png",
      ...data,
    })),
    create: jest.fn(),
  };
  const app = new Hono();
  const handler = new Handler(service as any);
  app.patch("/files/:uuid", (c, next) => handler.execute(c, next));
  const form = new FormData();
  form.append("data", JSON.stringify({ alt: "Cover", variant: "hidden" }));
  const response = await app.request("/files/file-1", {
    method: "PATCH",
    body: form,
  });
  expect(response.status).toBe(200);
  expect(service.update).toHaveBeenCalledWith({
    id: "file-1",
    data: { alt: "Cover", variant: "hidden" },
  });
  expect(service.create).not.toHaveBeenCalled();
  expect(await response.json()).toEqual({
    data: { id: "file-1", file: "/cover.png", alt: "Cover", variant: "hidden" },
  });
});
