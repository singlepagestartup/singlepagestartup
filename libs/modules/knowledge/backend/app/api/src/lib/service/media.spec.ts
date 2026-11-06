import { MediaService } from "./media";
jest.mock("file-type", () => ({
  fileTypeFromBuffer: jest.fn(async () => undefined),
}));
it.each([
  { file: "/logo.svg", mimeType: "image/svg+xml" },
  { file: "/renamed.png", mimeType: "image/png" },
  { file: "/notes.txt", mimeType: "text/plain" },
])("rejects SVG before model or native rendering: $file", async (file) => {
  const generate = jest.fn();
  const run = jest.fn();
  const service = new MediaService({ provider: { generate } as any, run });
  jest
    .spyOn(service as any, "read")
    .mockResolvedValue(
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    );
  await expect(service.analyze(file as any, "Context")).rejects.toThrow("SVG");
  expect(generate).not.toHaveBeenCalled();
  expect(run).not.toHaveBeenCalled();
});

it("preserves ordinary UTF-8 text without a visual analysis request", async () => {
  const generate = jest.fn();
  const service = new MediaService({ provider: { generate } as any });
  jest
    .spyOn(service as any, "read")
    .mockResolvedValue(Buffer.from("Original project notes"));
  await expect(
    service.analyze({ file: "/notes.txt" } as any, "Context"),
  ).resolves.toBe("Original project notes");
  expect(generate).not.toHaveBeenCalled();
});
