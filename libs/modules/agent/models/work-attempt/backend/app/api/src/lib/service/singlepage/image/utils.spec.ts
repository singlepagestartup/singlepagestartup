import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  captionLayer,
  coverDigest,
  describeAppearance,
  prepareCoverPhoto,
  readCoverBrief,
} from "./utils";

const replies = [
  { id: "size", text: "Размер 1024×1280." },
  {
    id: "palette",
    text: "Фон кремовый #F4EFDF. Основной цвет тёмно-зелёный #183C32. Акцент охра #CE954F.",
  },
  { id: "caption", text: "Без надписи." },
];
const attachments = [
  {
    id: "photo",
    messageId: "photo-message",
    digest: "photo-digest",
    mimeType: "image/jpeg",
    name: "photo.jpg",
  },
];

it("includes the background, primary color and accent in the cover render description", () => {
  const parsed = readCoverBrief(replies, attachments);
  expect(parsed).toHaveProperty("brief");
  if (!("brief" in parsed)) {
    throw new Error("The cover brief must be complete");
  }
  const description = describeAppearance(parsed.brief.appearance);
  expect(description).toContain("Background — Фон кремовый #F4EFDF");
  expect(description).toContain("Colors — Основной цвет тёмно-зелёный #183C32");
  expect(description).toContain("Акцент охра #CE954F");
});

it("changes the brief digest when the buyer replaces one palette role", () => {
  const original = readCoverBrief(replies, attachments);
  const updated = readCoverBrief(
    [...replies, { id: "update", text: "Акцент терракотовый #C96B54." }],
    attachments,
  );
  expect(original).toHaveProperty("brief");
  expect(updated).toHaveProperty("brief");
  if (!("brief" in original) || !("brief" in updated)) {
    throw new Error("Both cover briefs must be complete");
  }
  const description = describeAppearance(updated.brief.appearance);
  expect(description).toContain("#F4EFDF");
  expect(description).toContain("#183C32");
  expect(description).toContain("#C96B54");
  expect(description).not.toContain("#CE954F");
  expect(coverDigest(updated.brief)).not.toBe(coverDigest(original.brief));
});

it("renders the approved caption without a panel and preserves existing briefs that omit the setting", async () => {
  const coverReplies = [
    ...replies.slice(0, -1),
    { id: "caption", text: "Надпись: Серия К27" },
  ];
  const coverAttachments = [
    ...attachments,
    {
      id: "font",
      messageId: "font-message",
      digest: "font-digest",
      mimeType: "font/ttf",
      name: "Onest.ttf",
    },
  ];
  const original = readCoverBrief(coverReplies, coverAttachments);
  const transparent = readCoverBrief(
    [
      ...coverReplies,
      {
        id: "revision",
        text: "Подложка надписи: без плашки.\nАкцент терракотовый #B65B45.\nЦвет текста: #B65B45.",
      },
    ],
    coverAttachments,
  );
  if (!("brief" in original) || !("brief" in transparent)) {
    throw new Error("Both cover briefs must be complete");
  }
  expect(transparent.brief).toMatchObject({
    caption: "Серия К27",
    captionBackground: "transparent",
    captionColor: "#B65B45",
  });
  const appearance = describeAppearance(transparent.brief.appearance);
  expect(appearance).toContain("Акцент терракотовый #B65B45");
  expect(appearance).not.toContain("#CE954F");
  // The pre-existing digest for this brief omitted the caption background.
  expect(coverDigest(original.brief)).toBe(
    "f908ff170aea6b6d557fe6e17d98f0d6b3ffc94f4ea911f0c1c5cc4e98e0af45",
  );
  const withPanel = { ...transparent.brief, captionBackground: undefined };
  expect(coverDigest(transparent.brief)).not.toBe(coverDigest(withPanel));

  const font = await readFile(
    "apps/studio/runtime/assets/fonts/Onest-wght.ttf",
  );
  const [panel, text] = await Promise.all([
    captionLayer(font, original.brief),
    captionLayer(font, transparent.brief),
  ]);
  if (!Buffer.isBuffer(panel.input) || !Buffer.isBuffer(text.input)) {
    throw new Error("Caption layers must contain PNG bytes");
  }
  const [panelRaster, textRaster] = await Promise.all([
    sharp(panel.input)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }),
    sharp(text.input).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const sidePixel =
    (Math.floor(panelRaster.info.height / 2) * panelRaster.info.width + 20) * 4;
  expect([...panelRaster.data.subarray(sidePixel, sidePixel + 4)]).toEqual([
    255, 247, 231, 255,
  ]);
  expect(textRaster.data[sidePixel + 3]).toBe(0);
  expect(textRaster.data.includes(Buffer.from([182, 91, 69, 255]))).toBe(true);
});

it("requires a renewed confirmation when stage skill guidance changes", () => {
  const parsed = readCoverBrief(replies, attachments);
  if (!("brief" in parsed)) {
    throw new Error("The cover brief must be complete");
  }
  const { brief } = parsed;
  const first = coverDigest(brief, "provider-edit", "Use a paper backdrop.");
  expect(
    coverDigest(brief, "provider-edit", "Use a ceramic backdrop."),
  ).not.toBe(first);
  expect(coverDigest(brief, "provider-edit")).not.toBe(first);
});

it("sends an opaque product photo as a bounded edit source and preserves a transparent packshot", async () => {
  const parsed = readCoverBrief(replies, attachments);
  if (!("brief" in parsed)) {
    throw new Error("The cover brief must be complete");
  }
  const { brief } = parsed;
  const opaque = await sharp({
    create: { width: 640, height: 480, channels: 3, background: "#c25727" },
  })
    .jpeg()
    .toBuffer();
  const edit = await prepareCoverPhoto(opaque, brief, true);
  if (!("sourceImage" in edit)) {
    throw new Error("An opaque photo needs an edit source");
  }
  expect(await sharp(edit.sourceImage).metadata()).toMatchObject({
    width: 512,
    height: 384,
    format: "jpeg",
  });
  expect(await prepareCoverPhoto(opaque, brief, false)).toHaveProperty(
    "product",
  );
  expect(coverDigest(brief, "provider-edit")).not.toBe(coverDigest(brief));

  const product = await sharp(opaque).resize(80, 60).png().toBuffer();
  const packed = await sharp({
    create: { width: 100, height: 100, channels: 4, background: "#00000000" },
  })
    .composite([{ input: product, left: 10, top: 10 }])
    .png()
    .toBuffer();
  const transparentBrief = {
    ...brief,
    photo: { ...brief.photo, mimeType: "image/png" },
  };
  expect(
    await prepareCoverPhoto(packed, transparentBrief, true),
  ).toHaveProperty("product");
});
