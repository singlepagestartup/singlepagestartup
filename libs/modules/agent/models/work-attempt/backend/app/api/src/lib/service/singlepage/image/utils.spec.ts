import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  captionLayer,
  composeCover,
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

it("keeps the product photo independent of later reference images and untyped uploads", () => {
  const product = { ...attachments[0], coverRole: "product-photo" as const };
  const styleReference = {
    ...attachments[0],
    id: "reference",
    messageId: "reference-message",
    digest: "reference-digest",
    coverRole: "style-reference" as const,
  };
  const unrelated = { ...attachments[0], id: "unscoped", messageId: "late" };
  const withoutDescription = [replies[0], replies[2]];
  expect(
    readCoverBrief(withoutDescription, [product, styleReference, unrelated]),
  ).toMatchObject({
    brief: { photo: product, styleReference, appearance: {} },
  });
  expect(
    readCoverBrief(withoutDescription, [
      attachments[0],
      styleReference,
      unrelated,
    ]),
  ).toMatchObject({
    brief: { photo: attachments[0], styleReference },
  });
  expect(
    readCoverBrief(withoutDescription, [styleReference, unrelated]),
  ).toEqual({ issues: ["photo"] });
  const before = readCoverBrief(withoutDescription, [product, styleReference]);
  const after = readCoverBrief(withoutDescription, [
    product,
    styleReference,
    { ...styleReference, digest: "new" },
  ]);
  if (!("brief" in before) || !("brief" in after)) {
    throw new Error("Expected complete cover briefs");
  }
  expect(coverDigest(before.brief)).not.toBe(coverDigest(after.brief));
});

it("uses explicitly named Russian width and height with a matching aspect ratio", () => {
  const parsed = readCoverBrief(
    [
      ...replies.slice(1),
      { id: "aspect", text: "Формат 3:4." },
      { id: "exact", text: "ширина 900 и высота 1200 пикселей" },
    ],
    attachments,
  );
  expect(parsed).toMatchObject({
    brief: { size: { width: 900, height: 1200 } },
  });
});

it("asks for clarification if the named and compact dimensions disagree", () => {
  const parsed = readCoverBrief(
    [
      ...replies.slice(1),
      {
        id: "exact",
        text: "Размер 1200×1600, ширина: 900, высота: 1200 пикселей.",
      },
    ],
    attachments,
  );
  expect(parsed).toEqual({ issues: ["size"] });
});

it("does not use a capitalized dimension sentence as a caption", () => {
  const parsed = readCoverBrief(
    [replies[1], { id: "exact", text: "Ширина 900 и высота 1200 пикселей" }],
    attachments,
  );
  expect(parsed).toEqual({ issues: ["caption"] });
});

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

it("uses transparent copy by default and renders a compact panel only when requested", async () => {
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
  // Older approvals used a different layout even if the input text was identical.
  expect(coverDigest(original.brief)).not.toBe(
    "f908ff170aea6b6d557fe6e17d98f0d6b3ffc94f4ea911f0c1c5cc4e98e0af45",
  );
  const withPanel = {
    ...transparent.brief,
    captionBackground: "panel" as const,
  };
  expect(coverDigest(transparent.brief)).not.toBe(coverDigest(withPanel));

  const font = await readFile(
    "apps/studio/runtime/assets/fonts/Onest-wght.ttf",
  );
  const [panel, text] = await Promise.all([
    captionLayer(font, withPanel),
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
  expect(panelRaster.data[3]).toBe(255);
  expect(panelRaster.info.width).toBeLessThan(original.brief.size.width * 0.6);
  expect(textRaster.data[3]).toBe(0);
  expect((await captionLayer(font, original.brief)).panel).toBe(false);
  expect(textRaster.data.includes(Buffer.from([182, 91, 69, 255]))).toBe(true);
});

it("keeps a full title and two buyer-supplied characteristics out of the artwork direction", async () => {
  const files = [
    ...attachments,
    {
      id: "font",
      messageId: "font-message",
      digest: "font-digest",
      mimeType: "font/ttf",
      name: "Onest.ttf",
    },
  ];
  const parsed = readCoverBrief(
    [
      { id: "size", text: "Размер 900×1200." },
      {
        id: "palette",
        text: "Для фона возьмём тёплый белый, для надписи — шалфейный",
      },
      { id: "caption", text: "Надпись: «Лён»" },
      {
        id: "primary",
        text: "Алиса, основной цвет подтверждаю: графитовый #383C40",
      },
      {
        id: "details",
        text: "напиши что она экологична и можно менять теплоту света от 4000 до 6000 К\nтакже добавь название настольная лампа «Лён»",
      },
      {
        id: "placement",
        text: "Текст разместите прямо на тёплом белом фоне, без полос, плашек и значков",
      },
    ],
    files,
  );
  if (!("brief" in parsed)) {
    throw new Error(
      `Expected a complete cover brief (${parsed.issues.join(", ")})`,
    );
  }
  const { brief } = parsed;
  expect(brief).toMatchObject({
    caption: "настольная лампа «Лён»",
    captionDetails: [
      "Экологична",
      "Можно менять теплоту света от 4000 до 6000 К",
    ],
    captionColor: "#566B5C",
    captionBackground: "transparent",
    suppressBands: true,
    suppressIcons: true,
    appearance: {
      background: "тёплый белый",
      palette: "основной цвет подтверждаю: графитовый #383C40",
    },
  });
  expect(describeAppearance(brief.appearance)).not.toMatch(
    /экологич|6000|напиши/iu,
  );
  const font = await readFile(
    "apps/studio/runtime/assets/fonts/Onest-wght.ttf",
  );
  const overlay = await captionLayer(font, brief);
  const titleOnly = await captionLayer(font, {
    ...brief,
    captionDetails: undefined,
  });
  if (!Buffer.isBuffer(overlay.input) || !Buffer.isBuffer(titleOnly.input)) {
    throw new Error("Expected measured caption rasters");
  }
  const dimensions = await sharp(overlay.input).metadata();
  const single = await sharp(titleOnly.input).metadata();
  expect(dimensions.height).toBeGreaterThan(single.height * 1.5);
  expect(overlay.left).toBeGreaterThanOrEqual(62);
  expect((overlay.top ?? 0) + dimensions.height).toBeLessThanOrEqual(1128);
  expect(overlay.panel).toBe(false);
  const ink = await sharp(overlay.input).ensureAlpha().raw().toBuffer();
  expect(ink.includes(Buffer.from([86, 107, 92, 255]))).toBe(true);
});

it.each([
  {
    text: "Также добавь название Кресло «Дуга».\nНапиши, что каркас сделан из гнутого ясеня.",
    caption: "Кресло «Дуга»",
    captionDetails: ["Каркас сделан из гнутого ясеня"],
  },
  { text: "Добавь название Кресло 2.0.", caption: "Кресло 2.0" },
  { text: "Добавь название Готово?", caption: "Готово?" },
  { text: "Добавь название Готово!", caption: "Готово!" },
  { text: "Добавь название «Готово. Точно!».", caption: "Готово. Точно!" },
  { text: "Заголовок: Кресло «Дуга».", caption: "Кресло «Дуга»." },
])(
  "preserves the title and its own punctuation in $text",
  ({ text, caption, captionDetails }) => {
    const parsed = readCoverBrief(
      [...replies, { id: "title", text }],
      [
        ...attachments,
        {
          id: "font",
          messageId: "font-message",
          digest: "font-digest",
          mimeType: "font/ttf",
          name: "Onest.ttf",
        },
      ],
    );
    expect(parsed).toMatchObject({
      brief: { caption, captionDetails },
    });
  },
);

it.each([
  { width: 900, height: 1200 },
  { width: 1200, height: 600 },
  { width: 640, height: 640 },
])(
  "preserves the left, right and upper artwork details in $width×$height",
  async (size) => {
    const createBlock = (background: string) =>
      sharp({ create: { width: 26, height: 26, channels: 3, background } })
        .png()
        .toBuffer();
    const colors = ["#EF2317", "#2AC336", "#2744EF"];
    const marks = await Promise.all(colors.map(createBlock));
    const square = await sharp({
      create: { width: 400, height: 400, channels: 3, background: "#aaa390" },
    })
      .composite([
        { input: marks[0], left: 7, top: 151 },
        { input: marks[1], left: 367, top: 151 },
        { input: marks[2], left: 151, top: 7 },
      ])
      .png()
      .toBuffer();
    const rendered = await composeCover(square, { size });
    const { data, info } = await sharp(rendered)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(info).toMatchObject(size);
    for (const color of colors) {
      expect(data.includes(Buffer.from(color.slice(1), "hex"))).toBe(true);
    }
  },
);

it("fits the attached transparent packshot above long copy and protects contrast without adding a panel", async () => {
  const parsed = readCoverBrief(
    [
      ...replies.slice(0, -1),
      {
        id: "caption",
        text: "Надпись: Каталог товаров. Характеристики: Компактный размер | Доступно несколько режимов работы",
      },
      { id: "color", text: "Цвет текста: #566B5C" },
    ],
    [
      ...attachments,
      {
        id: "font",
        messageId: "font-message",
        digest: "font-digest",
        mimeType: "font/ttf",
        name: "Onest.ttf",
      },
    ],
  );
  if (!("brief" in parsed)) {
    throw new Error("Expected a complete cover brief");
  }
  const { brief } = parsed;
  const font = await readFile(
    "apps/studio/runtime/assets/fonts/Onest-wght.ttf",
  );
  const caption = await captionLayer(font, brief);
  const red = await sharp({
    create: { width: 24, height: 92, channels: 3, background: "#EE3030" },
  })
    .png()
    .toBuffer();
  const portrait = await sharp({
    create: { width: 120, height: 100, channels: 4, background: "#00000000" },
  })
    .composite([
      { input: red, left: 4, top: 4 },
      { input: red, left: 90, top: 4 },
    ])
    .png()
    .toBuffer();
  const prepared = await prepareCoverPhoto(
    portrait,
    { ...brief, photo: { ...brief.photo, mimeType: "image/png" } },
    false,
  );
  if (!("product" in prepared) || !Buffer.isBuffer(caption.input)) {
    throw new Error("Expected a composited photo and caption");
  }
  const solid = await sharp({
    create: { width: 512, height: 512, channels: 3, background: "#566B5C" },
  })
    .png()
    .toBuffer();
  const image = await composeCover(solid, {
    size: brief.size,
    product: prepared.product,
    caption,
  });
  const { data, info } = await sharp(image)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(info).toMatchObject(brief.size);
  const firstCaptionRow = (caption.top ?? 0) * info.width * 3;
  expect(
    data.subarray(0, firstCaptionRow).includes(Buffer.from("EE3030", "hex")),
  ).toBe(true);
  expect(
    data.subarray(firstCaptionRow).includes(Buffer.from("EE3030", "hex")),
  ).toBe(false);
  expect(data.subarray(firstCaptionRow).some((channel) => channel > 200)).toBe(
    true,
  );
  const corner = firstCaptionRow + ((caption.left ?? 0) - 2) * 3;
  expect([...data.subarray(corner, corner + 3)]).toEqual([86, 107, 92]);
});

it("paints the saved caption preference with the order’s earlier exact palette color", async () => {
  const input = [
    {
      id: "start",
      text: "Нужна вертикальная обложка для кресла из гнутой берёзы. Фон тёплый молочный #F5EDE0, акцент терракотовый #B75E42.",
    },
    { id: "caption", text: "Надпись: Берёза 27" },
    {
      id: "revision",
      text: "Прошу вторую версию обложки: опусти круглый подиум, сделай его светло-терракотовым и отведи под надпись свободную полосу по моим заметкам и твоим правилам. Текст «Берёза 27», размер 900×1200.",
    },
  ];
  const files = [
    ...attachments,
    {
      id: "font",
      messageId: "font-message",
      digest: "font-digest",
      mimeType: "font/ttf",
      name: "Onest.ttf",
    },
  ];
  const preferences = {
    customer: [
      "В моих карточках мебели терракотовая надпись должна оставаться целиком на свободном молочном поле под товаром.",
    ],
    agent: ["Caption color: #ABC"],
  };
  const parsed = readCoverBrief(input, files, preferences);
  if (!("brief" in parsed)) {
    throw new Error("Expected a complete cover brief");
  }
  expect(parsed.brief.captionColor).toBe("#B75E42");
  const font = await readFile(
    "apps/studio/runtime/assets/fonts/Onest-wght.ttf",
  );
  const layer = await captionLayer(font, parsed.brief);
  if (!Buffer.isBuffer(layer.input)) {
    throw new Error("Expected a PNG caption layer");
  }
  const pixels = await sharp(layer.input).ensureAlpha().raw().toBuffer();
  expect(pixels.includes(Buffer.from([183, 94, 66, 255]))).toBe(true);

  const explicit = readCoverBrief(
    [
      ...input,
      {
        id: "explicit",
        text: "Цвет заголовка: #123456.",
      },
    ],
    files,
    preferences,
  );
  expect(explicit).toMatchObject({ brief: { captionColor: "#123456" } });
  expect(coverDigest(parsed.brief)).not.toBe(
    coverDigest({ ...parsed.brief, captionColor: "#123456" }),
  );
});

it("uses caption-specific defaults and ignores unrelated, negative or ambiguous notes", () => {
  const input = [
    ...replies.slice(0, -1),
    { id: "caption", text: "Надпись: Серия К27" },
  ];
  const files = [
    ...attachments,
    {
      id: "font",
      messageId: "font-message",
      digest: "font-digest",
      mimeType: "font/ttf",
      name: "Onest.ttf",
    },
  ];
  const unrelated = [
    "Фон терракотовый #B75E42.",
    "Терракотовая тень под подиумом.",
    "Цвет надписи: терракотовый или кремовый.",
    "Не используй терракотовую надпись.",
    "Раньше у нас была терракотовая надпись.",
    "Терракотовая надпись, но только если клиент просит.",
  ];
  const defaults = readCoverBrief(input, files, {
    customer: unrelated,
    agent: ["Text color: #ABC"],
  });
  expect(defaults).toMatchObject({ brief: { captionColor: "#AABBCC" } });
  const named = readCoverBrief(input, files, {
    customer: [
      "На обложке терракотовая надпись должна оставаться под круглым деревянным подиумом.",
    ],
    agent: [],
  });
  expect(named).toMatchObject({ brief: { captionColor: "#B65B45" } });
  const conflicting = readCoverBrief(input, files, {
    customer: ["Caption color: #ABC", "Цвет надписи: #CCDDEE"],
    agent: ["Caption color: #111111"],
  });
  expect(conflicting).toMatchObject({ brief: { captionColor: undefined } });
});

it("keeps only the current brief's explicit caption color when a style reference is present", () => {
  const input = [
    ...replies.slice(0, -1),
    { id: "caption", text: "Надпись: Серия К27" },
  ];
  const files = [
    ...attachments,
    {
      ...attachments[0],
      id: "inspiration",
      digest: "reference",
      coverRole: "style-reference" as const,
    },
    {
      id: "font",
      messageId: "font-message",
      digest: "font",
      mimeType: "font/ttf",
      name: "Onest.ttf",
    },
  ];
  const legacyPreferences = {
    customer: ["Цвет надписи: #B75E42"],
    agent: ["Цвет надписи: #603020"],
  };
  const parsed = readCoverBrief(input, files, legacyPreferences);
  if (!("brief" in parsed)) {
    throw new Error("Expected a complete style reference brief");
  }
  expect(parsed.brief.captionColor).toBeUndefined();
  expect(
    coverDigest(parsed.brief, "provider-edit", "Put the product on a podium"),
  ).toBe(
    coverDigest(parsed.brief, "provider-edit", "Add a bottom caption strip"),
  );
  const explicit = readCoverBrief(
    [...input, { id: "color", text: "Цвет заголовка: #123456." }],
    files,
    legacyPreferences,
  );
  expect(explicit).toMatchObject({ brief: { captionColor: "#123456" } });
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
