import { createHash } from "node:crypto";
import { createElement } from "react";
import satori from "satori";
import sharp, { type OverlayOptions } from "sharp";
import type { ICustomerWorkRunAttachment } from "@sps/rbac/models/subject/sdk/model";

export interface ICoverSize {
  width: number;
  height: number;
}

interface IBuyerReply {
  id: string;
  text: string;
}

type TCaptionBackground = "panel" | "transparent";

export interface ICoverBrief {
  size: ICoverSize;
  appearance: ICoverAppearance;
  caption: string | null;
  captionColor?: string;
  captionBackground?: TCaptionBackground;
  photo: ICustomerWorkRunAttachment;
  font?: ICustomerWorkRunAttachment;
}

interface ICoverAppearance {
  background?: string;
  palette?: string;
  composition?: string;
  style?: string;
}

export interface ICoverLayers {
  size: ICoverSize;
  product?: OverlayOptions;
  caption?: OverlayOptions;
}

export type TCoverIssue =
  | "size"
  | "background"
  | "photo"
  | "font"
  | "caption"
  | "caption-color"
  | "caption-background";

const dimensionPattern = /\b(\d{2,5})\s*[xх×]\s*(\d{2,5})\b/giu;
const aspectPattern =
  /(?:^|\s|[(:])([1-9]\d{0,2})\s*:\s*([1-9]\d{0,2})(?=$|\s|[),.!])/gmu;
const sizeLabel = /размер|формат|пропорци|сторон|size|aspect|ratio|format/iu;
const leadingAspect = /^\s*\d{1,3}\s*:\s*\d{1,3}(?:\s*$|\s*[,!.])/u;
const captionLabel =
  /(?:^|[\n;])\s*(?:caption|надпись|подпись|текст(?: на обложке)?)\s*[:—]\s*([^\n;]+)/iu;
const quotedCaption =
  /(?:caption|надписью?|подписью?|текст\s+на\s+обложке)\s*[«“"]([^»”"\n]+)[»”"]/iu;
const noCaption =
  /(?:^|[\n;.!?])\s*(?:без\s+(?:надписи|подписи|текста)|no\s+(?:caption|text))\s*(?=$|[\n;.!?])/iu;
const captionBackgroundLabel =
  /^(?:подложка\s+надписи|caption\s+background)\s*[:—]\s*(.*?)\s*[.!?]*$/iu;
const captionBackgroundModes = new Map<string, TCaptionBackground>([
  ["без плашки", "transparent"],
  ["transparent", "transparent"],
  ["с плашкой", "panel"],
  ["panel", "panel"],
]);
const appearanceFields = [
  "background",
  "palette",
  "composition",
  "style",
] as const;
const appearanceLabels = {
  background: /^(?:фон|освещение|background|lighting)\s*[:—]\s*(.+)/iu,
  palette: /^(?:цвета?|палитра|colors?|palette)\s*[:—]\s*(.+)/iu,
  composition:
    /^(?:что изобразить|композиция|расположение|сюжет|what to show|composition|layout)\s*[:—]\s*(.+)/iu,
  style: /^(?:стиль|настроение|style|mood)\s*[:—]\s*(.+)/iu,
};
const colorWord =
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?\b|кремов|бордов|коричнев|зел[её]н|\b(?:cream|green|burgundy|brown|black|white|blue|red|gray|teal)\b|син(?:ий|яя|ее)|красн|бежев|ч[её]рн|бел(?:ый|ая|ое)|сер(?:ый|ая|ое)/iu;
const paletteRoleLabels = [
  [
    "primary",
    /^(?:основной\s+цвет|главный\s+цвет|(?:primary|main)\s+colou?r)(?=\s|[:—#])/iu,
  ],
  ["accent", /^(?:акцент(?:ный\s+цвет)?|accent(?:\s+colou?r)?)(?=\s|[:—#])/iu],
] as const;
const hexColor = /#(?:[0-9a-f]{6}|[0-9a-f]{3})(?![\p{L}\p{N}])/giu;
const paletteColor =
  /т[её]мно[-‐‑–\s]+зел[её]н\p{L}*|dark[-\s]+green|кремов\p{L}*|\bcream\b/giu;
const captionColorInstruction =
  /^(?:(?:цвет\s+(?:основного\s+)?(?:текста|надписи|подписи)|(?:caption|text)\s+colou?r)(?=\s|[:—#]|$)|(?:основной\s+)?(?:текст|надпись|подпись)\s+(?=тоже|также|цвета|будет|#)|(?:main\s+)?(?:text|caption)\s+(?=also|should|uses?))/iu;
const compositionNote =
  /остав(?:ьте|ить|им)\s+[^.!?]{0,80}место|(?:leave|reserve)\s+[^.!?]{0,80}(?:space|room)/iu;
const compositionHint =
  /изобраз|композ|(?:по|в) центр|справа|слева|на (?:переднем|заднем) плане|располож|place |cent(?:er|re)|on the (?:left|right)/iu;
const backgroundHint = /фон|свет|сцен|shadow|background|lighting|scene/iu;
const styleHint =
  /стил|минимал|л[оа]фт|современн|ретро|style|minimal|modern|vintage/iu;
const rawCaption = /^[\p{Lu}\p{N}][\p{L}\p{N} ’'‑–-]{2,79}$/u;
const conversational =
  /^(?:фото|файл|шрифт|прикреп|прилага|загруж|снимок|размер|формат|цвет|палитра|стиль|фон|текст|надпись|подпись|спасибо|привет|нет|не\s|отлично|готово|пожалуйста|hello|thanks|no\s|please|size|format|caption|color|palette|style|background|uploaded|attach|font|product photo)/iu;
const rasterMimeTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpeg"],
  ["image/webp", "webp"],
]);
const supportedFontTypes = new Set([
  "font/ttf",
  "font/otf",
  "application/x-font-ttf",
  "application/x-font-opentype",
  "application/font-sfnt",
]);

export function isCoverConfirmation(reply: string) {
  const normalized = reply
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/u, "");
  return [
    "да",
    "подтверждаю",
    "генерируй",
    "да, генерируй",
    "yes",
    "confirm",
    "generate",
    "yes, generate",
  ].includes(normalized);
}

function exactColors(text: string) {
  return [
    ...new Set(
      [...text.matchAll(hexColor)].map(([hex]) => {
        const color = hex.slice(1).toUpperCase();
        return `#${color.length === 3 ? [...color].map((part) => part.repeat(2)).join("") : color}`;
      }),
    ),
  ];
}

function paletteColorKey(name: string) {
  return /^(?:кремов|cream)/iu.test(name) ? "cream" : "dark-green";
}

function matchedPair(text: string, pattern: RegExp) {
  const pairs = [...text.matchAll(pattern)].map((match) => ({
    width: Number(match[1]),
    height: Number(match[2]),
  }));
  const [first] = pairs;
  if (!first) {
    return undefined;
  }
  if (
    pairs.some(
      ({ width, height }) => width !== first.width || height !== first.height,
    )
  ) {
    return null;
  }
  return first;
}

function dimensions(
  pixels: ICoverSize | null | undefined,
  aspect: ICoverSize | null | undefined,
) {
  if (pixels === null || aspect === null || (!pixels && !aspect)) {
    return null;
  }
  if (
    pixels &&
    aspect &&
    pixels.width * aspect.height !== pixels.height * aspect.width
  ) {
    return null;
  }
  let size = pixels;
  if (!size && aspect) {
    let a = aspect.width;
    let b = aspect.height;
    while (b > 0) {
      [a, b] = [b, a % b];
    }
    const units = { width: aspect.width / a, height: aspect.height / a };
    const scale = Math.floor(1600 / Math.max(units.width, units.height));
    size = { width: units.width * scale, height: units.height * scale };
  }
  if (!size) {
    return null;
  }
  const { width, height } = size;
  if (
    Math.min(width, height) < 320 ||
    Math.max(width, height) > 4096 ||
    width * height > 8_000_000 ||
    Math.max(width, height) > 4 * Math.min(width, height)
  ) {
    return null;
  }
  return size;
}

export function readCoverBrief(
  replies: IBuyerReply[],
  attachments: ICustomerWorkRunAttachment[],
): { brief: ICoverBrief } | { issues: TCoverIssue[] } {
  let pixels: ICoverSize | null | undefined;
  let aspect: ICoverSize | null | undefined;
  let caption: string | null | undefined;
  let captionColor: string | null | undefined;
  let captionBackground: TCaptionBackground | null | undefined;
  const paletteColors = new Map<string, string>();
  const paletteRoles = new Map<(typeof paletteRoleLabels)[number][0], string>();
  const appearance: ICoverAppearance = {};
  for (const { text } of replies) {
    const nextPixels = matchedPair(text, dimensionPattern);
    const nextAspect =
      sizeLabel.test(text) || leadingAspect.test(text)
        ? matchedPair(text, aspectPattern)
        : undefined;
    if (nextPixels !== undefined) {
      pixels = nextPixels;
    }
    if (nextAspect !== undefined) {
      aspect = nextAspect;
    }
    const nextCaption = (
      captionLabel.exec(text)?.[1] ?? quotedCaption.exec(text)?.[1]
    )?.trim();
    if (nextCaption !== undefined) {
      caption = nextCaption.replace(/^[«“"]|[»”"]$/gu, "").trim();
    } else if (noCaption.test(text)) {
      caption = null;
    }
    for (const raw of text.split(/[\n;]+|(?<=[.!?])\s+/u)) {
      const sentence = raw.trim();
      if (
        !sentence ||
        isCoverConfirmation(sentence) ||
        captionLabel.test(sentence) ||
        quotedCaption.test(sentence) ||
        noCaption.test(sentence)
      ) {
        continue;
      }
      const backgroundSetting = captionBackgroundLabel.exec(sentence);
      if (backgroundSetting) {
        captionBackground =
          captionBackgroundModes.get(backgroundSetting[1].toLowerCase()) ??
          null;
        continue;
      }
      const namedColors = [...sentence.matchAll(paletteColor)];
      if (captionColorInstruction.test(sentence)) {
        const colors = exactColors(sentence);
        if (!colors.length && !sentence.includes("#")) {
          for (const [name] of namedColors) {
            const color = paletteColors.get(paletteColorKey(name));
            if (color && !colors.includes(color)) {
              colors.push(color);
            }
          }
        }
        captionColor = colors.length === 1 ? colors[0] : null;
        continue;
      }
      for (const [index, match] of namedColors.entries()) {
        const [name] = match;
        const colors = exactColors(
          sentence.slice(
            match.index + name.length,
            namedColors[index + 1]?.index,
          ),
        );
        if (colors.length === 1) {
          paletteColors.set(paletteColorKey(name), colors[0]);
        }
      }
      const field = appearanceFields.find((name) =>
        appearanceLabels[name].test(sentence),
      );
      if (field) {
        appearance[field] = appearanceLabels[field].exec(sentence)?.[1]?.trim();
        if (field === "palette") {
          paletteRoles.clear();
        }
        continue;
      }
      const paletteRole = paletteRoleLabels.find(([, label]) =>
        label.test(sentence),
      );
      if (paletteRole && colorWord.test(sentence)) {
        paletteRoles.set(paletteRole[0], sentence);
        continue;
      }
      if (compositionNote.test(sentence)) {
        if (!appearance.composition?.includes(sentence)) {
          appearance.composition = [appearance.composition, sentence]
            .filter(Boolean)
            .join("\n");
        }
      } else if (compositionHint.test(sentence)) {
        appearance.composition = sentence;
      } else if (backgroundHint.test(sentence)) {
        appearance.background = sentence;
      } else if (colorWord.test(sentence)) {
        appearance.palette = sentence;
      } else if (styleHint.test(sentence)) {
        appearance.style = sentence;
      } else if (
        caption === undefined &&
        (pixels || aspect) &&
        (paletteRoles.size || Object.values(appearance).some(Boolean)) &&
        rawCaption.test(sentence) &&
        !conversational.test(sentence) &&
        !sizeLabel.test(sentence)
      ) {
        caption = sentence;
      }
    }
  }
  if (paletteRoles.size) {
    appearance.palette = [appearance.palette, ...paletteRoles.values()]
      .filter(Boolean)
      .join("\n");
  }
  const size = dimensions(pixels, aspect);
  const photo = attachments.findLast(({ mimeType }) =>
    rasterMimeTypes.has(mimeType),
  );
  const font = attachments.findLast(
    ({ mimeType, name }) =>
      supportedFontTypes.has(mimeType) ||
      (mimeType === "application/octet-stream" && /\.(ttf|otf)$/iu.test(name)),
  );
  const issues: TCoverIssue[] = [];
  if (!size) {
    issues.push("size");
  }
  if (
    !Object.values(appearance).some(Boolean) ||
    describeAppearance(appearance).length > 800
  ) {
    issues.push("background");
  }
  if (!photo) {
    issues.push("photo");
  }
  if (
    caption === undefined ||
    (caption !== null &&
      (!caption || caption.length > 90 || /[\p{Cc}\p{Cf}]/u.test(caption)))
  ) {
    issues.push("caption");
  }
  if (caption && !font) {
    issues.push("font");
  }
  if (caption && captionColor === null) {
    issues.push("caption-color");
  }
  if (caption && captionBackground === null) {
    issues.push("caption-background");
  }
  if (issues.length || !size || !photo || caption === undefined) {
    return { issues };
  }
  return {
    brief: {
      size,
      appearance,
      caption,
      captionColor: caption ? (captionColor ?? undefined) : undefined,
      captionBackground: caption ? (captionBackground ?? undefined) : undefined,
      photo,
      font: caption ? font : undefined,
    },
  };
}

export function describeAppearance(
  appearance: ICoverAppearance,
  russian = false,
) {
  const labels = russian
    ? ["Фон", "Цвета", "Композиция", "Стиль"]
    : ["Background", "Colors", "Composition", "Style"];
  return appearanceFields
    .flatMap((field, index) =>
      appearance[field] ? [`${labels[index]} — ${appearance[field]}`] : [],
    )
    .join("\n");
}

export function coverDigest(
  brief: ICoverBrief,
  productMode?: "provider-edit",
  skillGuidance?: string,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        size: brief.size,
        appearance: describeAppearance(brief.appearance),
        caption: brief.caption,
        captionColor: brief.captionColor,
        captionBackground: brief.captionBackground,
        photo: [brief.photo.id, brief.photo.digest],
        font: brief.font && [brief.font.id, brief.font.digest],
        productMode,
        skillGuidance,
      }),
    )
    .digest("hex");
}

function rasterFormat(bytes: Buffer) {
  if (bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return "png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export const photoByteLimit = 8 * 1024 * 1024;
export const fontByteLimit = 1024 * 1024;

export async function prepareCoverPhoto(
  bytes: Buffer,
  brief: ICoverBrief,
  allowEdit: boolean,
): Promise<{ product: OverlayOptions } | { sourceImage: Uint8Array }> {
  const format = rasterFormat(bytes);
  if (
    !format ||
    format !== rasterMimeTypes.get(brief.photo.mimeType) ||
    bytes.length > photoByteLimit
  ) {
    throw new Error("Unsupported product image");
  }
  const photo = sharp(bytes, { failOn: "error", limitInputPixels: 24_000_000 });
  const metadata = await photo.metadata();
  if (
    metadata.format !== format ||
    (metadata.pages ?? 1) !== 1 ||
    (metadata.width ?? 0) < 16 ||
    (metadata.height ?? 0) < 16
  ) {
    throw new Error("Unsupported product image");
  }
  if (allowEdit) {
    const alpha = metadata.hasAlpha
      ? (await photo.stats()).channels.at(-1)
      : undefined;
    if (alpha?.max === 0) {
      throw new Error("The product image is fully transparent");
    }
    if (!alpha || alpha.min >= 16 || alpha.mean >= 250) {
      const sourceImage = await photo
        .rotate()
        .resize({
          width: 512,
          height: 512,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toBuffer();
      return { sourceImage };
    }
  }
  const { width, height } = brief.size;
  const frameWidth = Math.round(width * 0.82);
  const frameHeight = Math.round(height * (brief.caption ? 0.66 : 0.82));
  const { data, info } = await photo
    .rotate()
    .resize({ width: frameWidth, height: frameHeight, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  return {
    product: {
      input: data,
      left: Math.floor((width - info.width) / 2),
      top: Math.floor(
        (frameHeight - info.height) / 2 +
          height * (brief.caption ? 0.07 : 0.09),
      ),
    },
  };
}

function verifyFontTables(bytes: Buffer) {
  if (
    bytes.length < 12 ||
    bytes.length > fontByteLimit ||
    (bytes.readUInt32BE(0) !== 0x00010000 &&
      bytes.toString("ascii", 0, 4) !== "OTTO")
  ) {
    throw new Error("Unsupported font format");
  }
  const count = bytes.readUInt16BE(4);
  const endOfDirectory = 12 + count * 16;
  if (!count || count > 128 || endOfDirectory > bytes.length) {
    throw new Error("Invalid font table directory");
  }
  const tables = new Map<string, number>();
  for (let index = 12; index < endOfDirectory; index += 16) {
    const tag = bytes.toString("ascii", index, index + 4);
    const offset = bytes.readUInt32BE(index + 8);
    const length = bytes.readUInt32BE(index + 12);
    if (
      tag === "SVG " ||
      tables.has(tag) ||
      offset < endOfDirectory ||
      length > bytes.length - offset
    ) {
      throw new Error("Invalid font table");
    }
    if (
      tag === "maxp" &&
      (length < 6 || bytes.readUInt16BE(offset + 4) > 30_000)
    ) {
      throw new Error("Unsupported glyph count");
    }
    tables.set(tag, length);
  }
  if (
    !["cmap", "head", "hhea", "hmtx", "maxp"].every((tag) => tables.get(tag)) ||
    !(
      (tables.has("glyf") && tables.has("loca")) ||
      tables.has("CFF ") ||
      tables.has("CFF2")
    )
  ) {
    throw new Error("The font must contain local outlines and glyph metrics");
  }
}

export async function captionLayer(
  bytes: Buffer,
  brief: ICoverBrief,
): Promise<OverlayOptions> {
  const { caption } = brief;
  if (!caption) {
    throw new Error("Missing caption text");
  }
  verifyFontTables(bytes);
  const { width, height } = brief.size;
  const panelWidth = Math.round(width * 0.86);
  const panelHeight = Math.round(height * 0.18);
  const fontSize = Math.round(
    Math.min(width * (caption.length < 24 ? 0.067 : 0.05), panelHeight * 0.3),
  );
  const panelStyle =
    brief.captionBackground === "transparent"
      ? {}
      : {
          backgroundColor: "#fff7e7",
          borderRadius: Math.round(panelHeight * 0.2),
        };
  const svg = await satori(
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          width: panelWidth,
          height: panelHeight,
          padding: Math.round(panelWidth * 0.05),
          fontFamily: "BuyerCoverFont",
          fontSize,
          color: brief.captionColor ?? "#172a21",
          ...panelStyle,
        },
      },
      caption,
    ),
    {
      width: panelWidth,
      height: panelHeight,
      fonts: [{ name: "BuyerCoverFont", data: bytes }],
      loadAdditionalAsset: async () => {
        throw new Error("The font does not cover the requested caption");
      },
    },
  );
  return {
    input: await sharp(Buffer.from(svg)).png().toBuffer(),
    top: Math.round(height * 0.77),
    left: Math.floor((width - panelWidth) / 2),
  };
}

export async function composeCover(
  background: Uint8Array,
  layers: ICoverLayers,
) {
  const { width, height } = layers.size;
  const base = await sharp(background, {
    failOn: "error",
    limitInputPixels: 1_100_000,
  })
    .resize({ width, height, fit: "cover" })
    .png()
    .toBuffer();
  const overlays = [layers.product, layers.caption].filter(
    (layer): layer is OverlayOptions => layer !== undefined,
  );
  if (!overlays.length) {
    return base;
  }
  return sharp(base).composite(overlays).png().toBuffer();
}
