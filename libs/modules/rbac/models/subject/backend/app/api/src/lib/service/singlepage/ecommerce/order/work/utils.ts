import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import sharp from "sharp";

function makePdf(
  attemptId: string,
  text: string,
  font: string,
  preview: boolean,
) {
  const document = new jsPDF({ compress: true });
  const token = createHash("sha256")
    .update(`${attemptId}:${preview}`)
    .digest("hex")
    .slice(0, 32);
  document.setFileId(token);
  document.setCreationDate(new Date(0));
  document.addFileToVFS("Onest.ttf", font);
  document.addFont("Onest.ttf", "Onest", "normal");
  document.setFont("Onest");
  document.setFontSize(11);
  const lines = document.splitTextToSize(text, 175) as string[];
  let y = 20;
  if (preview) {
    document.text("Предпросмотр", 15, y);
    y += 10;
  }
  for (const line of lines) {
    if (y > 275) {
      document.addPage();
      y = 20;
    }
    document.text(line, 15, y);
    y += 6;
  }
  return new Uint8Array(document.output("arraybuffer"));
}

export async function pdfOrderResult(attemptId: string, text: string) {
  const content = text.trim();
  if (content.length < 10 || content.length > 250_000) {
    throw new Error(
      "Validation error. The PDF result text length is out of range",
    );
  }
  const fontPath = path.resolve(
    __dirname,
    "../../../../../../../../../../../../../../../apps/studio/runtime/assets/fonts/Onest-wght.ttf",
  );
  const font = (await readFile(fontPath)).toString("base64");
  const excerptLength = Math.min(480, Math.floor(content.length / 2));
  return {
    original: {
      name: "result.pdf",
      mimeType: "application/pdf",
      bytes: makePdf(attemptId, content, font, false),
    },
    preview: {
      name: "preview.pdf",
      mimeType: "application/pdf",
      bytes: makePdf(
        attemptId,
        `${content.slice(0, excerptLength).trimEnd()}…`,
        font,
        true,
      ),
    },
  };
}

export async function imageOrderResult(bytes: Uint8Array) {
  const original = await sharp(bytes).rotate().png().toBuffer();
  const image = sharp(original);
  const size = await image.metadata();
  if (!size.width || !size.height || Math.max(size.width, size.height) < 16) {
    throw new Error(
      "Validation error. Result image is too small for a separate preview",
    );
  }
  const longestSide = Math.min(
    640,
    Math.floor(Math.max(size.width, size.height) / 2),
  );
  const preview = await image
    .resize({ width: longestSide, height: longestSide, fit: "inside" })
    .jpeg({ quality: 65 })
    .toBuffer();
  return {
    original: { name: "result.png", mimeType: "image/png", bytes: original },
    preview: { name: "preview.jpg", mimeType: "image/jpeg", bytes: preview },
  };
}
