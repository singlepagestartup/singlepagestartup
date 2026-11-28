import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { StageSkillsUnavailable } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/customer-work/knowledge";
import type {
  ICustomerWorkRate,
  ICustomerWorkRunAttachment,
} from "@sps/rbac/models/subject/sdk/model";
import { CoverWork, readCoverReview, type IConfirmedCover } from "./index";
import { coverDigest, readCoverBrief } from "./utils";

function automaticCover(
  triggerText = "Без надписи.",
  storedFiles?: Map<string, Buffer>,
  orderFormula = false,
) {
  const input = {
    storeId: "store",
    taskId: "task",
    assigneeId: "agent",
    eventId: "event",
    assignmentRevision: 2,
  };
  const context = {
    imageBrief: {
      replies: [
        { id: "initial", text: "Размер 900×1200. Фон: молочный." },
        { id: "trigger", text: triggerText },
      ],
      designMessages: undefined as
        | { id: string; role: "user" | "assistant"; content: string }[]
        | undefined,
      triggerMessageId: "trigger",
      triggerRevision: 10,
      triggerCreatedAt: 2000,
      previews: [] as {
        versionId: string;
        postedRevision?: number;
        digest?: string;
      }[],
      newerReplies: [] as { id: string; text: string; hasFiles?: boolean }[],
    },
    attachments: [
      {
        id: "photo",
        messageId: "initial",
        digest: "photo-digest",
        mimeType: "image/jpeg",
        name: "photo.jpg",
      },
    ] as ICustomerWorkRunAttachment[],
    messages: [],
    sourceVersions: [],
    knowledgeSourceIds: [] as string[],
    skillTitles: ["Cover styling"],
    approvedRates: undefined as ICustomerWorkRate[] | undefined,
  };
  const work = {
    taskId: input.taskId,
    storeId: input.storeId,
    customerId: "buyer",
    kind: "individual-service",
    paid: false,
    files: [] as { id: string; createdAt: string }[],
  };
  const tariff = {
    currencyId: "token",
    formula: "provider_usd * 2",
    formulaVersion: "2",
    inputs: {},
  };
  const terms = {
    maxInputTokens: 1000,
    maxOutputTokens: 100,
    maxCostUsd: "1",
    inputUsdPerMillion: "10",
    outputUsdPerMillion: "50",
    usdPerSps: "0.01",
    workMultiplier: "1",
    version: "model-terms",
    workTokenTariff: JSON.stringify(tariff),
  };
  const funding = orderFormula
    ? { payer: "customer", orderFormula: true, currencyId: "token" }
    : { payer: "store-owner" };
  const approved = {
    provider: "openai",
    model: "image-model",
    capability: "image",
    ...terms,
  } as const;
  const resolveWork = jest
    .fn()
    .mockResolvedValue({ provider: "openai", model: approved.model, terms });
  const effectiveWorkFunding = jest
    .fn()
    .mockResolvedValue({ ...funding, workTokenTariff: tariff });
  const workScope = jest.fn();
  const service = new CoverWork({
    modules: {
      crm: {
        task: {
          getWork: jest.fn().mockResolvedValue({
            task: {
              id: input.taskId,
              storeId: input.storeId,
              customerId: "buyer",
              orderId: "order",
              publicationId: "publication",
            },
            stage: {
              id: "image",
              output: "image",
              imageBrief: "marketplace-cover",
              imageBriefAutoGenerate: true,
            },
            funding,
          }),
        },
      },
      ecommerce: {
        order: { work: { findByOrder: jest.fn().mockResolvedValue(work) } },
      },
      fileStorage: {
        file: {
          privateContent: {
            findById: async ({ id }: { id: string }) => {
              const bytes = storedFiles?.get(id);
              return (
                bytes && {
                  bytes,
                  size: bytes.length,
                  digest: createHash("sha256").update(bytes).digest("hex"),
                }
              );
            },
          },
        },
      },
      rbac: {
        subject: {
          customerWork: {
            contextForRun: jest.fn().mockResolvedValue(context),
            effectiveWorkFunding,
          },
          providerConnections: { workScope, resolveWork },
        },
      },
    },
  } as unknown as ConstructorParameters<typeof CoverWork>[0]);
  if (!storedFiles) {
    jest
      .spyOn(
        service as unknown as { artwork: () => Promise<unknown> },
        "artwork",
      )
      .mockResolvedValue({ layers: { size: { width: 900, height: 1200 } } });
  }
  return {
    service,
    input,
    context,
    work,
    resolveWork,
    workScope,
    tariff,
    approved,
  };
}

it("requires the approved image rate from the order tariff before preparing a cover", async () => {
  const f = automaticCover("Без надписи.", undefined, true);
  f.context.approvedRates = [{ ...f.approved, outputUsdPerMillion: "1" }];
  await expect(f.service.prepare(f.input)).rejects.toThrow(
    "approve the current stage rate",
  );
  expect(f.workScope).toHaveBeenCalledWith(
    expect.objectContaining({ orderId: "order" }),
    expect.objectContaining({ output: "image" }),
    expect.objectContaining({ workTokenTariff: f.tariff }),
  );
  f.context.approvedRates = [f.approved];
  await expect(f.service.prepare(f.input)).resolves.not.toBeNull();
});

it.each([true, false])(
  "keeps original input files and free-form design instructions for a clean OpenAI cover (style reference %s)",
  async (withReference) => {
    const product = await sharp({
      create: { width: 32, height: 48, channels: 4, background: "#FF000080" },
    })
      .png()
      .toBuffer();
    const style = await sharp({
      create: { width: 48, height: 32, channels: 3, background: "#0000FF" },
    })
      .webp()
      .toBuffer();
    const direction =
      "Подтверждаю. Нарисуй лампу с заголовком «Долгий свет» по диагонали.";
    const staff = "Надпись может идти по диагонали.";
    const files = new Map([
      ["product", product],
      ["style", style],
    ]);
    const f = automaticCover(direction, files);
    f.context.skillTitles = [];
    f.context.imageBrief.replies = [
      { id: "initial", text: "Сделай квадратную карточку 1024×1024." },
      { id: "trigger", text: direction },
    ];
    f.context.imageBrief.designMessages = [
      {
        id: "initial",
        role: "user",
        content: "Сделай квадратную карточку 1024×1024.",
      },
      { id: "staff", role: "assistant", content: staff },
      { id: "pause", role: "user", content: "Не генерируй пока." },
      { id: "trigger", role: "user", content: direction },
    ];
    f.context.attachments = [
      {
        id: "product",
        name: "product.png",
        messageId: "initial",
        mimeType: "image/png",
        coverRole: "product-photo",
        digest: createHash("sha256").update(product).digest("hex"),
      },
    ];
    if (withReference) {
      f.context.attachments.push({
        id: "style",
        name: "style.webp",
        messageId: "initial",
        mimeType: "image/webp",
        coverRole: "style-reference",
        digest: createHash("sha256").update(style).digest("hex"),
      });
    }

    const cover = await f.service.prepare(f.input);
    expect(cover).toMatchObject({
      providerArtwork: {
        width: 1024,
        height: 1024,
        productPhoto: { bytes: product, mimeType: "image/png" },
        styleImage: withReference
          ? { bytes: style, mimeType: "image/webp" }
          : undefined,
        conversation: [
          { role: "user", content: "Сделай квадратную карточку 1024×1024." },
          { role: "assistant", content: staff },
          { role: "user", content: direction },
        ],
      },
    });
    expect(cover).not.toHaveProperty("layers");
    expect(cover).not.toHaveProperty("text");
    expect(() =>
      f.service.assertConfirmed(f.context, cover as IConfirmedCover),
    ).not.toThrow();
    f.context.knowledgeSourceIds = ["authorized-customer-reference"];
    expect(() =>
      f.service.assertConfirmed(f.context, cover as IConfirmedCover),
    ).toThrow("design guidance changed");
    if (withReference) {
      const guidedCover = await f.service.prepare(f.input);
      expect(guidedCover).toMatchObject({
        providerArtwork: {
          styleImage: { bytes: style },
          productPhoto: { bytes: product },
          guidance: expect.any(String),
          conversation: expect.arrayContaining([
            { role: "user", content: direction },
          ]),
        },
      });
      expect(() =>
        f.service.assertConfirmed(f.context, guidedCover as IConfirmedCover),
      ).not.toThrow();
    }
  },
);

it("validates both role-bound images and carries the supplied font as a sample without local overlays", async () => {
  const [productPhoto, styleImage, font] = await Promise.all([
    sharp({
      create: { width: 48, height: 48, channels: 3, background: "#F00000" },
    })
      .png()
      .toBuffer(),
    sharp({
      create: { width: 48, height: 48, channels: 3, background: "#0000F0" },
    })
      .png()
      .toBuffer(),
    readFile("apps/studio/runtime/assets/fonts/Onest-wght.ttf"),
  ]);
  const files = new Map([
    ["product", productPhoto],
    ["reference", styleImage],
    ["font", font],
  ]);
  const f = automaticCover(
    "Надпись: Лён\nХарактеристики: Свет 4000–6000 К",
    files,
  );
  const digest = (bytes: Buffer) =>
    createHash("sha256").update(bytes).digest("hex");
  f.context.attachments = [
    {
      id: "product",
      name: "lamp.png",
      messageId: "initial",
      mimeType: "image/png",
      coverRole: "product-photo",
      digest: digest(productPhoto),
    },
    {
      id: "reference",
      name: "example.png",
      messageId: "style",
      mimeType: "image/png",
      coverRole: "style-reference",
      digest: digest(styleImage),
    },
    {
      id: "font",
      name: "Onest.ttf",
      messageId: "trigger",
      mimeType: "font/ttf",
      digest: digest(font),
    },
  ];
  const cover = await f.service.prepare(f.input);
  if (!cover || !("styleReference" in cover) || !cover.styleReference?.copy) {
    throw new Error(
      "Expected a ready cover with both images and approved copy",
    );
  }
  expect(cover.layers).toEqual({ size: { width: 900, height: 1200 } });
  expect(cover.sourceImage).toBeUndefined();
  expect(cover.styleReference.copy).toMatchObject({
    title: "Лён",
    details: ["Свет 4000–6000 К"],
  });
  const {
    productPhoto: product,
    styleImage: reference,
    copy,
  } = cover.styleReference;
  const [productPixels, referencePixels, fontImage] = await Promise.all([
    sharp(product).raw().toBuffer(),
    sharp(reference).raw().toBuffer(),
    sharp(copy.fontSample).metadata(),
  ]);
  expect(productPixels[0]).toBeGreaterThan(200);
  expect(referencePixels[2]).toBeGreaterThan(200);
  expect(fontImage.format).toBe("jpeg");
  expect(() => f.service.assertConfirmed(f.context, cover)).not.toThrow();
  f.context.attachments[1].digest = "changed-while-running";
  expect(() => f.service.assertConfirmed(f.context, cover)).toThrow(
    "confirmed cover inputs changed",
  );
});

it("hands the ready accumulated brief to the paid JEV without asking again for the size or approval", async () => {
  const f = automaticCover();
  const cover = await f.service.prepare(f.input);
  expect(cover).toMatchObject({
    brief: { size: { width: 900, height: 1200 } },
    review: { operation: "request-routing", input: { capability: "decision" } },
  });
  expect(cover).not.toHaveProperty("text");
});

it("honors a pause before spending on JEV or image work and keeps it on a bare acknowledgement", async () => {
  const f = automaticCover("Без надписи. Пока не рисуй.");
  await expect(f.service.prepare(f.input)).resolves.toMatchObject({
    text: expect.stringContaining("на паузу"),
  });
  f.context.imageBrief.replies.splice(1, 0, {
    id: "paused",
    text: "Без надписи. Пока не рисуй.",
  });
  f.context.imageBrief.replies[2].text = "Да";
  await expect(f.service.prepare(f.input)).resolves.toHaveProperty(
    "conversation",
  );
  expect(f.resolveWork).not.toHaveBeenCalled();
  f.context.imageBrief.replies[2].text = "Теперь рисуй";
  await expect(f.service.prepare(f.input)).resolves.toHaveProperty("review");
});

it("rechecks a pause that arrived while JEV was running", async () => {
  const f = automaticCover();
  const cover = await f.service.prepare(f.input);
  expect(cover).toHaveProperty("review");
  f.context.imageBrief.newerReplies.push({ id: "late", text: "Пока не рисуй" });
  expect(() =>
    f.service.assertConfirmed(f.context, cover as IConfirmedCover),
  ).toThrow("paused the cover request");
});

it.each([
  "Спасибо!",
  "Результат принимаю",
  "Сколько стоит?",
  "Как скачать?",
  "Лампа стоит на столе.",
])("does not regenerate an existing preview for %s", async (text) => {
  const f = automaticCover(text);
  f.context.imageBrief.replies.splice(1, 0, {
    id: "previous-copy",
    text: "Без надписи.",
  });
  f.work.files.push({
    id: "preview",
    createdAt: new Date(1000).toISOString(),
  });
  f.context.imageBrief.previews.push({
    versionId: "preview",
    postedRevision: 8,
  });
  await expect(f.service.prepare(f.input)).resolves.toHaveProperty(
    "conversation",
  );
});

it("accepts a substantive revision after a preview and skips the input already answered by that preview", async () => {
  const f = automaticCover("Размер: 1200×1600");
  f.context.imageBrief.replies.splice(1, 0, {
    id: "previous-copy",
    text: "Без надписи.",
  });
  f.work.files.push({
    id: "preview",
    createdAt: new Date(1000).toISOString(),
  });
  f.context.imageBrief.previews.push({
    versionId: "preview",
    postedRevision: 10,
  });
  await expect(f.service.prepare(f.input)).resolves.toEqual({ skip: true });
  f.context.imageBrief.triggerRevision = 11;
  await expect(f.service.prepare(f.input)).resolves.toMatchObject({
    brief: { size: { width: 1200, height: 1600 } },
    review: expect.any(Object),
  });
});

it("asks only for missing material and accepts only an explicit JEV decision to generate", async () => {
  const f = automaticCover("Без надписи.");
  f.context.attachments = [];
  await expect(f.service.prepare(f.input)).resolves.toMatchObject({
    text: "Пришлите фото товара в PNG, JPEG или WebP.",
  });
  expect(f.resolveWork).not.toHaveBeenCalled();
  expect(readCoverReview('{"decision":"generate"}')?.decision).toBe("generate");
  expect(readCoverReview('{"decision":"wait"}')?.decision).toBe("wait");
  expect(readCoverReview('{"route":"answer"}')).toBeUndefined();
});

it("returns a cover-stage reply when a selected skill is no longer linked", async () => {
  const input = {
    storeId: "store",
    taskId: "task",
    assigneeId: "agent",
    eventId: "event",
    assignmentRevision: 2,
  };
  const error = new StageSkillsUnavailable(false);
  const contextForRun = jest.fn().mockRejectedValue(error);
  const resolve = jest.fn();
  const cover = new CoverWork({
    modules: {
      crm: {
        task: {
          getWork: jest.fn().mockResolvedValue({
            task: {
              id: input.taskId,
              storeId: input.storeId,
              customerId: "buyer",
              orderId: "order",
            },
            stage: { output: "image", imageBrief: "marketplace-cover" },
          }),
        },
      },
      ecommerce: {
        order: {
          work: {
            findByOrder: jest.fn().mockResolvedValue({
              taskId: input.taskId,
              storeId: input.storeId,
              customerId: "buyer",
              kind: "individual-service",
              paid: false,
            }),
          },
        },
      },
      rbac: {
        subject: {
          customerWork: { contextForRun },
          providerConnections: { resolve },
        },
      },
    },
  } as unknown as ConstructorParameters<typeof CoverWork>[0]);

  await expect(cover.prepare(input, true)).resolves.toEqual({
    text: error.reply,
    imageDraftDigest: null,
  });
  expect(resolve).not.toHaveBeenCalled();
});

it("rechecks the resolved caption color against the buyer’s confirmed draft", () => {
  const replies = [
    { id: "order", text: "Размер 900×1200. Фон: молочный." },
    { id: "caption", text: "Надпись: Берёза 27" },
    { id: "approval", text: "Генерируй" },
  ];
  const attachments = [
    {
      id: "photo",
      messageId: "photo-message",
      digest: "photo-digest",
      mimeType: "image/jpeg",
      name: "photo.jpg",
    },
    {
      id: "font",
      messageId: "font-message",
      digest: "font-digest",
      mimeType: "font/ttf",
      name: "Onest.ttf",
    },
  ];
  const captionDefaults = { customer: ["Цвет текста: #B75E42"], agent: [] };
  const result = readCoverBrief(replies, attachments, captionDefaults);
  if (!("brief" in result)) {
    throw new Error("Expected a complete cover brief");
  }
  const confirmed: IConfirmedCover = {
    brief: result.brief,
    digest: coverDigest(result.brief),
    publicationId: "publication",
    stageId: "stage",
    layers: { size: result.brief.size },
    provider: "openai",
  };
  const context = {
    imageBrief: {
      replies,
      triggerMessageId: "approval",
      draftReplyAnchorId: "caption",
      draftDigest: confirmed.digest,
      captionDefaults,
    },
    attachments,
    messages: [],
    sourceVersions: [],
  };
  const service = new CoverWork(
    {} as ConstructorParameters<typeof CoverWork>[0],
  );
  expect(() => service.assertConfirmed(context, confirmed)).not.toThrow();
  expect(() =>
    service.assertConfirmed(
      {
        ...context,
        imageBrief: {
          ...context.imageBrief,
          captionDefaults: { customer: ["Цвет текста: #224466"], agent: [] },
        },
      },
      confirmed,
    ),
  ).toThrow("The confirmed cover inputs changed");
});
