import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  mkdtemp,
  mkdir,
  copyFile,
  writeFile,
  rm,
  access,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { MediaService } from "./media";
jest.mock("file-type", () => ({
  fileTypeFromBuffer: async (bytes: Buffer) =>
    bytes.subarray(0, 5).toString() === "%PDF-"
      ? { ext: "pdf", mime: "application/pdf" }
      : { ext: "png", mime: "image/png" },
}));
function pdfFixture() {
  const text = "BT /F1 12 Tf 20 100 Td (Knowledge parser fixture) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    "<< /Length " + text.length + " >>\nstream\n" + text + "\nendstream",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [i, obj] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += i + 1 + " 0 obj\n" + obj + "\nendobj\n";
  }
  const xref = Buffer.byteLength(pdf);
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (const offset of offsets.slice(1))
    pdf += String(offset).padStart(10, "0") + " 00000 n \n";
  pdf += "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n";
  return Buffer.from(pdf);
}
it.each(["png", "pdf"])(
  "processes a real supported %s fixture with native tools and a fake model provider",
  async (format) => {
    const bytes =
      format === "png"
        ? await sharp({
            create: { width: 8, height: 8, channels: 3, background: "white" },
          })
            .png()
            .toBuffer()
        : pdfFixture();
    const generate = jest.fn(async () => ({
      text: "Fixture visual description",
      finishReason: "stop",
    }));
    const directory = await mkdtemp(
      path.join(tmpdir(), "sps-knowledge-fonts-"),
    );
    const fonts = path.join(directory, "fonts");
    const cache = path.join(directory, "cache");
    await mkdir(fonts);
    await mkdir(cache);
    for (const font of [
      "/System/Library/Fonts/Supplemental/Arial.ttf",
      "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]) {
      try {
        await access(font);
        await copyFile(font, path.join(fonts, "fixture.ttf"));
        break;
      } catch {
        /* Try the other platform's font. */
      }
    }
    const config = path.join(directory, "fonts.conf");
    await writeFile(
      config,
      "<fontconfig><dir>" +
        fonts +
        "</dir><cachedir>" +
        cache +
        "</cachedir></fontconfig>",
    );
    const native = promisify(execFile);
    const service = new MediaService({
      provider: { generate } as any,
      readFile: async () => bytes,
      run: ((command: string, args: string[], options: object) =>
        native(command, args, {
          ...options,
          env: {
            ...process.env,
            FONTCONFIG_FILE: config,
            FONTCONFIG_PATH: directory,
          },
        })) as any,
    });
    try {
      await expect(
        service.analyze(
          {
            file: "/fixture." + format,
            extension: format,
            mimeType: format === "pdf" ? "application/pdf" : "image/png",
          } as any,
          "Fixture notes",
        ),
      ).resolves.toContain("Fixture visual description");
      expect(generate).toHaveBeenCalledTimes(1);
      const payload = (generate.mock.calls[0] as any)[0].context[0].content[1]
        .image_url.url;
      expect(payload).toMatch(/^data:image\/jpeg;base64,/);
      expect(JSON.stringify(generate.mock.calls)).not.toContain(
        "image/svg+xml",
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
  60000,
);
