import { Service as MediaService } from "./media";
import { access } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";
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

it("reads UTF-8 markup as text without invoking a renderer or model", async () => {
  const text = '<html><a href="https://example.org/">Example</a></html>';
  const generate = jest.fn();
  const run = jest.fn();
  const service = new MediaService({
    readFile: async () => Buffer.from(text),
    provider: { generate } as any,
    run,
  });
  await expect(
    service.analyze({ file: "/notes.html" } as any, ""),
  ).resolves.toBe(text);
  expect(run).not.toHaveBeenCalled();
  expect(generate).not.toHaveBeenCalled();
});

it("rejects an unlisted detected container before starting a native tool", async () => {
  jest
    .mocked(fileTypeFromBuffer)
    .mockResolvedValueOnce({ mime: "image/x-icon", ext: "ico" });
  const run = jest.fn();
  const service = new MediaService({
    readFile: async () => Buffer.from("fixture"),
    run,
  });
  await expect(
    service.analyze({ file: "/image.jpg" } as any, ""),
  ).rejects.toThrow("Unsupported Knowledge file format");
  expect(run).not.toHaveBeenCalled();
});

it.each(["false", "invalid"])(
  "keeps text readable and disables native processing for %s",
  async (setting) => {
    const previous = process.env.KNOWLEDGE_NATIVE_MEDIA_ENABLED;
    process.env.KNOWLEDGE_NATIVE_MEDIA_ENABLED = setting;
    try {
      const run = jest.fn();
      const generate = jest.fn();
      const service = new MediaService({
        readFile: async () => Buffer.from("project notes"),
        provider: { generate } as any,
        run,
      });
      jest
        .mocked(fileTypeFromBuffer)
        .mockResolvedValueOnce({ mime: "application/pdf", ext: "pdf" });
      await expect(
        service.analyze({ file: "/report.pdf" } as any, ""),
      ).rejects.toThrow("Native Knowledge media processing is disabled");
      await expect(
        service.analyze({ file: "/notes.txt" } as any, ""),
      ).resolves.toBe("project notes");
      expect(run).not.toHaveBeenCalled();
      expect(generate).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env.KNOWLEDGE_NATIVE_MEDIA_ENABLED;
      } else {
        process.env.KNOWLEDGE_NATIVE_MEDIA_ENABLED = previous;
      }
    }
  },
);

it("spreads the frame budget over a long video and caps the decoder output", async () => {
  jest
    .mocked(fileTypeFromBuffer)
    .mockResolvedValueOnce({ mime: "video/mp4", ext: "mp4" });
  const run = jest
    .fn()
    .mockResolvedValueOnce({
      stdout: JSON.stringify({
        format: { duration: "3600" },
        streams: [{ codec_type: "video" }],
      }),
    })
    .mockResolvedValueOnce({ stdout: "" });
  const service = new MediaService({
    readFile: async () => Buffer.from("fixture"),
    run,
  });
  await service.analyze({ file: "/clip.mp4" } as any, "");
  const [program, args] = run.mock.calls[1];
  expect(program).toBe("ffmpeg");
  expect(args[args.indexOf("-vf") + 1]).toContain("fps=1/30:");
  expect(args[args.indexOf("-frames:v") + 1]).toBe("120");
  expect(args[args.indexOf("-t") + 1]).toBe("3600");
});

it("limits a decoder to the selected input format and omits API environment and file details on failure", async () => {
  jest
    .mocked(fileTypeFromBuffer)
    .mockResolvedValueOnce({ mime: "image/png", ext: "png" });
  const run = jest
    .fn()
    .mockRejectedValue(new Error("fixture document metadata"));
  const service = new MediaService({
    readFile: async () => Buffer.from("fixture"),
    run,
  });
  await expect(
    service.analyze({ file: "/client name.png" } as any, ""),
  ).rejects.toThrow(/^Knowledge media processing failed \(ffmpeg\)\.$/);
  const [program, args, options] = run.mock.calls[0];
  expect(program).toBe("ffmpeg");
  expect(args[args.indexOf("-protocol_whitelist") + 1]).toBe("file");
  expect(args[args.indexOf("-format_whitelist") + 1]).toBe("png_pipe");
  expect(args[args.indexOf("-f") + 1]).toBe("png_pipe");
  expect(options.env).toEqual({
    HOME: options.cwd,
    TMPDIR: options.cwd,
    PATH: process.env.PATH,
    LC_ALL: "C",
  });
  expect(options.shell).toBe(false);
  expect(args).not.toContain("/client name.png");
  await expect(access(options.cwd)).rejects.toMatchObject({ code: "ENOENT" });
});
