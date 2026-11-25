import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import sharp from "sharp";
import Decimal from "decimal.js";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import type {
  IOrderWorkPurchaseQuote,
  TOrderWorkPriceBasis,
} from "@sps/ecommerce/models/order/sdk/model";

const Money = Decimal.clone({ precision: 64 });
type TConfirmedCostPricing = Extract<
  NonNullable<IFunnelStage["resultPricing"]>,
  { kind: "confirmed-cost" }
>;
type TConfirmedCostBasis = Extract<
  TOrderWorkPriceBasis,
  { kind: "confirmed-cost" }
>;

interface IReadReservedCost {
  id: string;
  currencyId: string;
  settlement: { workAmount: string } | null;
}

export function calculateConfirmedResultPrice(input: {
  reservations: IReadReservedCost[];
  currencyId: string;
  precision: number;
  tariff: TConfirmedCostPricing;
  quotedAt: string;
}): { price: string; costs: TConfirmedCostBasis["costs"] } {
  const grouped = new Map<
    string,
    { amount: Decimal; reservationIds: string[] }
  >();
  for (const { id, currencyId, settlement } of input.reservations) {
    if (!settlement) {
      throw new Error(
        "Conflict error. Confirmed work is missing settlement details",
      );
    }
    const cost = grouped.get(currencyId) ?? {
      amount: new Money(0),
      reservationIds: [],
    };
    cost.amount = cost.amount.plus(settlement.workAmount);
    cost.reservationIds.push(id);
    grouped.set(currencyId, cost);
  }
  let amount = new Money(0);
  const costs: TConfirmedCostBasis["costs"] = [];
  for (const [currencyId, cost] of grouped) {
    const conversion = input.tariff.conversions.find(
      (entry) =>
        entry.fromCurrencyId === currencyId &&
        entry.toCurrencyId === input.currencyId,
    );
    if (
      conversion &&
      Date.parse(conversion.observedAt) > Date.parse(input.quotedAt)
    ) {
      throw new Error(
        "Conflict error. The configured exchange rate is dated in the future",
      );
    }
    if (!conversion && currencyId !== input.currencyId) {
      throw new Error(
        "Conflict error. No exchange rate is configured for the confirmed work currency",
      );
    }
    amount = amount.plus(
      conversion ? cost.amount.times(conversion.rate) : cost.amount,
    );
    costs.push({
      currencyId,
      amount: cost.amount.toFixed(),
      reservationIds: cost.reservationIds,
      ...(conversion
        ? {
            conversion: {
              fromCurrencyId: conversion.fromCurrencyId,
              toCurrencyId: conversion.toCurrencyId,
              rate: conversion.rate,
              source: conversion.source,
              observedAt: conversion.observedAt,
            },
          }
        : {}),
    });
  }
  const price = amount
    .times(input.tariff.multiplier)
    .toDecimalPlaces(input.precision, Decimal.ROUND_HALF_UP);
  if (!price.gt(0)) {
    throw new Error(
      "Conflict error. Confirmed work does not produce a positive result price",
    );
  }
  return { price: price.toFixed(input.precision), costs };
}

export function priceResultCharges(
  quote: IOrderWorkPurchaseQuote,
  price: string,
  publicationId: string,
): IOrderWorkPurchaseQuote {
  const fixedCharges = quote.charges
    .filter((charge) => charge.role !== "product")
    .reduce((sum, charge) => sum.plus(charge.amount), new Money(0));
  const itemCharge = new Money(price).minus(fixedCharges);
  if (itemCharge.isNegative()) {
    throw new Error(
      "Conflict error. Result price is smaller than the selected service charges",
    );
  }
  return {
    ...quote,
    charges: quote.charges.map((charge) =>
      charge.role === "product"
        ? {
            ...charge,
            amount: itemCharge.toFixed(),
            unitAmount: null,
            formula: "confirmed_work_cost * multiplier",
            formulaVersion: publicationId,
            inputs: {
              result_price: price,
              fixed_service_charges: fixedCharges.toFixed(),
            },
          }
        : charge,
    ),
  };
}

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
  if (preview) {
    for (let page = 1; page <= document.getNumberOfPages(); page += 1) {
      document.setPage(page);
      document.setFontSize(40);
      document.setTextColor(175);
      document.text("ПРЕДПРОСМОТР", 65, 180, { angle: 35 });
    }
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

export async function imageOrderResult(
  bytes: Uint8Array,
  { preserveOriginal = false }: { preserveOriginal?: boolean } = {},
) {
  const original = preserveOriginal
    ? bytes
    : await sharp(bytes).rotate().png().toBuffer();
  const image = sharp(original);
  const size = await image.metadata();
  if (preserveOriginal && size.format !== "png") {
    throw new Error("Validation error. The original image must be a PNG");
  }
  if (!size.width || !size.height || Math.max(size.width, size.height) < 16) {
    throw new Error(
      "Validation error. Result image is too small for a separate preview",
    );
  }
  const longestSide = Math.min(
    640,
    Math.floor(Math.max(size.width, size.height) / 2),
  );
  const thumbnail = await image
    .resize({ width: longestSide, height: longestSide, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = thumbnail.info;
  const fontSize = Math.min(width / 6, height / 2, 64);
  const mark =
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <g transform="translate(${width / 2} ${height / 2}) rotate(-16)" opacity=".68">
      <rect x="${-fontSize * 2.5}" y="${-fontSize * 0.72}" width="${fontSize * 5}" height="${fontSize * 1.44}" rx="${fontSize / 6}" fill="#222"/>
      <text text-anchor="middle" y="${fontSize * 0.36}" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">PREVIEW</text>
    </g></svg>`);
  const preview = await sharp(thumbnail.data)
    .composite([{ input: mark }])
    .jpeg({ quality: 65 })
    .toBuffer();
  return {
    original: { name: "result.png", mimeType: "image/png", bytes: original },
    preview: { name: "preview.jpg", mimeType: "image/jpeg", bytes: preview },
  };
}
