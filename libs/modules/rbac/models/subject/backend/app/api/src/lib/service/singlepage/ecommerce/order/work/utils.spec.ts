import sharp from "sharp";
import {
  calculateConfirmedResultPrice,
  imageOrderResult,
  pdfOrderResult,
} from "./utils";

const settlement = (id: string, currencyId: string, workAmount: string) => ({
  id,
  currencyId,
  settlement: { workAmount },
});
const observedAt = "2026-11-19T00:00:00.000Z";
const quotedAt = "2026-11-19T01:00:00.000Z";
const rate = {
  fromCurrencyId: "expense",
  toCurrencyId: "sale",
  source: "Fixture exchange rate",
  rate: "0.01",
  observedAt,
};
const input = {
  reservations: [
    settlement("settled-first", "sale", "2.345"),
    settlement("settled-second", "expense", "0.5"),
  ],
  currencyId: "sale",
  precision: 2,
  quotedAt,
  tariff: {
    kind: "confirmed-cost" as const,
    multiplier: "1.5",
    conversions: [rate],
  },
};

it("prices confirmed work using recorded exchange rates and rounds the final total once", () => {
  expect(calculateConfirmedResultPrice(input)).toEqual({
    price: "3.53",
    costs: [
      {
        currencyId: "sale",
        amount: "2.345",
        reservationIds: ["settled-first"],
      },
      {
        currencyId: "expense",
        amount: "0.5",
        reservationIds: ["settled-second"],
        conversion: rate,
      },
    ],
  });
});

it("refuses a missing or future exchange rate and a zero result price", () => {
  expect(() =>
    calculateConfirmedResultPrice({
      ...input,
      tariff: { ...input.tariff, conversions: [] },
    }),
  ).toThrow("No exchange rate");
  expect(() =>
    calculateConfirmedResultPrice({
      ...input,
      quotedAt: "2026-11-18T00:00:00.000Z",
    }),
  ).toThrow("dated in the future");
  expect(() =>
    calculateConfirmedResultPrice({
      ...input,
      reservations: [settlement("zero", "sale", "0")],
    }),
  ).toThrow("positive result price");
});

it("retains the provider's exact PNG bytes and adds a visible watermark to the downscaled preview", async () => {
  const providerImage = await sharp({
    create: {
      width: 768,
      height: 1024,
      channels: 4,
      background: "#4B6D8E80",
    },
  })
    .png({ compressionLevel: 0 })
    .toBuffer();
  const result = await imageOrderResult(providerImage, {
    preserveOriginal: true,
  });
  expect(result.original.bytes).toEqual(providerImage);
  expect(await sharp(result.preview.bytes).metadata()).toMatchObject({
    format: "jpeg",
    width: 384,
    height: 512,
  });
  const { channels } = await sharp(result.preview.bytes).stats();
  expect(channels.every((channel) => channel.max - channel.min > 80)).toBe(
    true,
  );
});

it("marks each page of the PDF preview while preserving the complete original", async () => {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const sample =
    Array.from({ length: 130 }, (_, i) => String(i)).join("\n") +
    "\nProtected original ending";
  const result = await pdfOrderResult("preview-test", sample);
  async function pageTexts(bytes: Uint8Array) {
    const document = getDocument({
      data: Uint8Array.from(bytes),
      useSystemFonts: false,
    });
    const pdf = await document.promise;
    try {
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const content = await (await pdf.getPage(i)).getTextContent();
        pages.push(
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" "),
        );
      }
      return pages;
    } finally {
      await document.destroy();
    }
  }
  const previewPages = await pageTexts(result.preview.bytes);
  expect(previewPages.length).toBeGreaterThan(1);
  expect(previewPages.every((page) => page.includes("ПРЕДПРОСМОТР"))).toBe(
    true,
  );
  expect(previewPages.join(" ")).not.toContain("Protected original ending");
  const original = (await pageTexts(result.original.bytes)).join(" ");
  expect(original).toContain("Protected original ending");
  expect(original).not.toContain("ПРЕДПРОСМОТР");
});

it("uses the complete UTF-8 brief draft for explicitly enabled text previews", async () => {
  const text = "Цели и ограничения проекта.\n".repeat(30) + "Уточнить бюджет.";
  const result = await pdfOrderResult("business-brief", text, {
    fullTextPreview: true,
  });
  expect(result.preview).toEqual({
    name: "brief-draft.txt",
    mimeType: "text/plain",
    bytes: Buffer.from(text),
  });
  expect(result.original).toMatchObject({
    name: "business-brief.pdf",
    mimeType: "application/pdf",
  });
  expect(Buffer.from(result.original.bytes.subarray(0, 5)).toString()).toBe(
    "%PDF-",
  );
});
