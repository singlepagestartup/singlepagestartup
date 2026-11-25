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

interface ICaptionDefaults {
  customer: readonly string[];
  agent: readonly string[];
}

type TCaptionBackground = "panel" | "transparent";

export interface ICoverBrief {
  size: ICoverSize;
  appearance: ICoverAppearance;
  caption: string | null;
  captionDetails?: string[];
  captionColor?: string;
  captionBackground?: TCaptionBackground;
  suppressIcons?: boolean;
  suppressBands?: boolean;
  photo: ICustomerWorkRunAttachment;
  styleReference?: ICustomerWorkRunAttachment;
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
  caption?: ICoverCaptionLayer;
}

interface ICoverCaptionLayer extends OverlayOptions {
  input: Buffer;
  ink?: string;
  panel?: boolean;
}

export class CoverCopyDoesNotFit extends Error {}

export type TCoverIssue =
  | "size"
  | "background"
  | "photo"
  | "font"
  | "caption"
  | "caption-color"
  | "caption-background";

const dimensionPattern = /\b(\d{2,5})\s*[xх×]\s*(\d{2,5})\b/giu;
const namedDimensionPattern =
  /(?<![\p{L}\p{N}_])(?:ширина|шириной)\s*[:—–-]?\s*(\d{2,5})\b(?:\s*(?:пикселей|пикселя|пиксель|пкс|px))?\s*(?:[,;]\s*|и\s+)?(?:высота|высотой)\s*[:—–-]?\s*(\d{2,5})\b/giu;
const aspectPattern =
  /(?:^|\s|[(:])([1-9]\d{0,2})\s*:\s*([1-9]\d{0,2})(?=$|\s|[),.!])/gmu;
const sizeLabel = /размер|формат|пропорци|сторон|size|aspect|ratio|format/iu;
const leadingAspect = /^\s*\d{1,3}\s*:\s*\d{1,3}(?:\s*$|\s*[,!.])/u;
const captionLabel =
  /^(?:caption|headline|надпись|подпись|заголовок|название(?: товара)?|текст(?: на обложке)?)\s*[:—]\s*(.+)$/iu;
const quotedCaption =
  /(?:caption|надписью?|подписью?|текст\s+на\s+обложке)\s*[«“"]([^»”"\n]+)[»”"]/iu;
const noCaption =
  /(?:^|[\n;.!?])\s*(?:без\s+(?:надписи|подписи|текста)|no\s+(?:caption|text))\s*(?=$|[\n;.!?])/iu;
const titleRequest =
  /^(?:и\s+)?(?:(?:также|ещ[её]|also)\s+)?(?:добав(?:ь|ьте)|напиши(?:те)?|укажи(?:те)?|add|write|include)\s+(?:(?:полное|the)\s+)?(?:название(?:\s+товара)?|заголовок|(?:product\s+)?title|headline)\s*[:—–-]?\s+(.+)$/iu;
const detailLabel =
  /^(?:подзаголовок|характеристики(?:\s+на\s+обложке)?|выноски|subtitle|features?|highlights?|callouts?)\s*[:—]\s*(.+)$/iu;
const writeDetail =
  /^(?:и\s+)?(?:(?:также|ещ[её]|also)\s+)?(?:напиши(?:те)?|укажи(?:те)?|отметь(?:те)?|добав(?:ь|ьте)|write|mention|note|add)\s*[,]?\s+(?:что|that)\s+(.+)$/iu;
const backgroundChoice =
  /^для\s+фона(?:\s+(?:возьм[её]м|выберем|используй(?:те)?|нужен))?\s*[:—–]?\s*(.+?)(?=,\s*для\s+(?:надписи|текста|заголовка)|$)/iu;
const inkChoice =
  /(?:^|,\s*)для\s+(?:надписи|текста|заголовка)(?:\s+(?:возьм[её]м|выберем|используй(?:те)?|нужен))?\s*[:—–]?\s*(.+)$/iu;
const directCopyPlacement =
  /^(?:текст|надпись|заголовок|caption|text|headline)\s+(?:размест\p{L}*|помест\p{L}*|постав\p{L}*|полож\p{L}*|write|place|set)\s+(?:прямо\s+|directly\s+)?(?:на|on)\s+(.+?)\s+(?:фоне|backdrop|background)(?=$|[\s,.!?])/iu;
const excludedDecorations =
  /(?:^|[\s,])(?:без|without|no)\s+([^.!?;]{1,120})/iu;
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
  /#[0-9a-f]{3}(?:[0-9a-f]{3})?\b|терракотов|кремов|шалфейн|графитов|бордов|коричнев|зел[её]н|\b(?:cream|terracotta|sage|graphite|green|burgundy|brown|black|white|blue|red|gray|teal)\b|син(?:ий|яя|ее)|красн|бежев|ч[её]рн|бел(?:ый|ая|ое)|сер(?:ый|ая|ое)/iu;
const paletteRoleLabels = [
  [
    "primary",
    /^(?:основной\s+цвет|главный\s+цвет|(?:primary|main)\s+colou?r)(?=\s|[:—#])/iu,
  ],
  ["accent", /^(?:акцент(?:ный\s+цвет)?|accent(?:\s+colou?r)?)(?=\s|[:—#])/iu],
] as const;
const hexColor = /#(?:[0-9a-f]{6}|[0-9a-f]{3})(?![\p{L}\p{N}])/giu;
const paletteColor =
  /т[её]мно[-‐‑–\s]+зел[её]н\p{L}*|dark[-\s]+green|терракотов\p{L}*|\bterracotta\b|кремов\p{L}*|\bcream\b|шалфейн\p{L}*|\bsage(?: green)?\b|графитов\p{L}*|\bgraphite\b/giu;
const captionColorInstruction =
  /^(?:(?:цвет\s+(?:основного\s+)?(?:текста|надписи|подписи)|(?:caption|text)\s+colou?r)(?=\s|[:—#]|$)|(?:основной\s+)?(?:текст|надпись|подпись)\s+(?=тоже|также|цвета|будет|#)|(?:main\s+)?(?:text|caption)\s+(?=also|should|uses?))/iu;
// Defaults accept a complete caption-specific directive, not general palette prose.
const captionDefaultLabel =
  /^(?:цвет\s+(?:текста|надписи|подписи|заголовка|букв)|(?:caption|lettering|text|headline)\s+colou?r)\s*[:—–]\s*(.+)$/iu;
const captionDefaultPhrase =
  /^(?:(?:для\s+(?:этой\s+)?обложки|на\s+обложке|по\s+умолчанию|в\s+моих\s+карточках(?:\s+[\p{L}-]+){0,2})[\s,:—–]+)?(?:(?:предпочитаю|хочу|используй(?:те)?|использовать|сделай(?:те)?|сделать|размести(?:те)?|нужна|use|prefer)\s+(?:an?\s+)?)?(.+?)\s+(?:надпис(?:ь|и)|подпис(?:ь|и)|текст|буквы|заголовок|caption|lettering|text|headline)(.*)$/iu;
const captionPlacement =
  /^(?:\s+(?:долж(?:на|ен|но|ны)\s+(?:быть|оставаться|располагаться|находиться|размещаться)|must\s+(?:be|stay|remain)))?(?:\s+(?:(?:целиком|полностью|fully|entirely)\s+)?(?:на|в|под|над|on|in|under|above)\s+[^!?.]{1,140})?$/iu;
const nonDirective =
  /(?:^|[^\p{L}\p{N}])(?:не|но|или|либо|вместо|если|раньше|ранее|or|not|instead|unless|formerly)(?=$|[^\p{L}\p{N}])/iu;
const exactCaptionColor =
  /^(.*?)(?:\s*\(\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\s*\)|\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?))$/iu;
const wholePaletteName = new RegExp(`^(?:${paletteColor.source})$`, "iu");
const compositionNote =
  /остав(?:ьте|ить|им)\s+[^.!?]{0,80}место|(?:leave|reserve)\s+[^.!?]{0,80}(?:space|room)/iu;
const compositionHint =
  /изобраз|композ|(?:по|в) центр|справа|слева|на (?:переднем|заднем) плане|располож|иконк|пиктограмм|знач(?:ок|ки|ка)|\bicons?\b|pictogram|place |cent(?:er|re)|on the (?:left|right)/iu;
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

export function isCoverFont(attachment: ICustomerWorkRunAttachment) {
  return (
    supportedFontTypes.has(attachment.mimeType) ||
    (attachment.mimeType === "application/octet-stream" &&
      /\.(ttf|otf)$/iu.test(attachment.name))
  );
}

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
  if (/^(?:терракотов|terracotta)/iu.test(name)) {
    return "terracotta";
  }
  if (/^(?:шалфейн|sage)/iu.test(name)) {
    return "sage";
  }
  if (/^(?:графитов|graphite)/iu.test(name)) {
    return "graphite";
  }
  return /^(?:кремов|cream)/iu.test(name) ? "cream" : "dark-green";
}

function namedCaptionColor(name: string, palette: ReadonlyMap<string, string>) {
  const key = paletteColorKey(name);
  const swatches: Record<string, string> = {
    terracotta: "#B65B45",
    sage: "#566B5C",
    graphite: "#383C40",
  };
  return palette.get(key) ?? swatches[key];
}

function defaultCaptionColors(
  instructions: readonly string[],
  palette: ReadonlyMap<string, string>,
) {
  const colors = new Set<string>();
  for (const instruction of instructions) {
    for (const part of instruction.split(/[\n;]+|(?<=[.!?])\s+/u)) {
      const statement = part
        .trim()
        .replace(/[.!?]+$/u, "")
        .trim();
      if (nonDirective.test(statement)) {
        continue;
      }
      const phrase = captionDefaultPhrase.exec(statement);
      const value =
        captionDefaultLabel.exec(statement)?.[1] ??
        (phrase && captionPlacement.test(phrase[2]) ? phrase[1] : undefined);
      if (!value) {
        continue;
      }
      const exact = exactCaptionColor.exec(value);
      if (exact && (!exact[1] || wholePaletteName.test(exact[1].trim()))) {
        colors.add(exactColors(exact[2] ?? exact[3])[0]);
      } else if (wholePaletteName.test(value)) {
        const color = namedCaptionColor(value, palette);
        if (color) {
          colors.add(color);
        }
      }
    }
  }
  return colors;
}

function defaultCaptionColor(
  defaults: ICaptionDefaults,
  palette: ReadonlyMap<string, string>,
) {
  const customer = defaultCaptionColors(defaults.customer, palette);
  const colors = customer.size
    ? customer
    : defaultCaptionColors(defaults.agent, palette);
  return colors.size === 1 ? [...colors][0] : undefined;
}

function matchedPair(text: string, ...patterns: RegExp[]) {
  const pairs = patterns.flatMap((pattern) =>
    Array.from(text.matchAll(pattern), ([, width, height]) => ({
      width: Number(width),
      height: Number(height),
    })),
  );
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

function briefStatements(text: string) {
  const statements: string[] = [];
  const quotes: Record<string, string> = { '"': '"', "«": "»", "“": "”" };
  let closing = "";
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (closing) {
      if (character === closing) {
        closing = "";
      }
      continue;
    }
    if (quotes[character]) {
      closing = quotes[character];
      continue;
    }
    if (character === "\n" || character === ";") {
      statements.push(text.slice(start, index).trim());
      start = index + 1;
    } else if (/[.!?]/u.test(character) && /\s/u.test(text[index + 1] ?? "")) {
      statements.push(text.slice(start, index + 1).trim());
      start = index + 1;
    }
  }
  statements.push(text.slice(start).trim());
  return statements.filter(Boolean);
}

function exactCaption(text: string) {
  const value = text.trim();
  return (
    /^(?:«(.+)»|“(.+)”|"(.+)")[.!?]?$/u.exec(value)?.slice(1).find(Boolean) ??
    value
  );
}

function detailLines(text: string) {
  return text
    .split(
      /\s*[•|]\s*|\s+и\s+(?=(?:можно|меняется|поддерживает|работает|имеет|регулируется|включает)\s)|\s+and\s+(?=(?:can|has|supports|includes)\s)/iu,
    )
    .map((part) =>
      exactCaption(part)
        .replace(/^(?:она|он|оно|они|it)\s+/iu, "")
        .replace(/[.!]+$/u, "")
        .trim(),
    )
    .filter(Boolean)
    .map((part) => part[0].toLocaleUpperCase() + part.slice(1));
}

function readCaptionColor(text: string, palette: ReadonlyMap<string, string>) {
  const colors = exactColors(text);
  if (!colors.length && !text.includes("#")) {
    for (const [name] of text.matchAll(paletteColor)) {
      const color = namedCaptionColor(name, palette);
      if (color && !colors.includes(color)) {
        colors.push(color);
      }
    }
  }
  return colors.length === 1 ? colors[0] : null;
}

export function readCoverBrief(
  replies: IBuyerReply[],
  attachments: ICustomerWorkRunAttachment[],
  captionDefaults?: ICaptionDefaults,
  providerArtwork = false,
): { brief: ICoverBrief } | { issues: TCoverIssue[] } {
  let pixels: ICoverSize | null | undefined;
  let aspect: ICoverSize | null | undefined;
  let caption: string | null | undefined;
  let captionDetails: string[] = [];
  let captionColorInput: string | undefined;
  let captionBackground: TCaptionBackground | null | undefined;
  let suppressIcons: boolean | undefined;
  let suppressBands: boolean | undefined;
  const paletteColors = new Map<string, string>();
  const paletteRoles = new Map<(typeof paletteRoleLabels)[number][0], string>();
  const appearance: ICoverAppearance = {};
  for (const { text } of replies) {
    const nextPixels = matchedPair(
      text,
      dimensionPattern,
      namedDimensionPattern,
    );
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
    let nextDetails: string[] | undefined;
    for (const sentence of briefStatements(text)) {
      if (isCoverConfirmation(sentence)) {
        continue;
      }
      const requestedTitle = titleRequest.exec(sentence)?.[1];
      const title =
        requestedTitle?.replace(/(?<!\.)\.$/u, "") ??
        captionLabel.exec(sentence)?.[1] ??
        quotedCaption.exec(sentence)?.[1];
      if (title !== undefined) {
        caption = exactCaption(title);
        continue;
      }
      if (noCaption.test(sentence)) {
        caption = null;
        captionDetails = [];
        nextDetails = undefined;
        continue;
      }
      const detail =
        detailLabel.exec(sentence)?.[1] ?? writeDetail.exec(sentence)?.[1];
      if (detail !== undefined) {
        nextDetails ??= /^(?:и\s+)?(?:также|ещ[её]|also)\s/iu.test(sentence)
          ? [...captionDetails]
          : [];
        nextDetails.push(...detailLines(detail));
        continue;
      }
      const decorations = excludedDecorations.exec(sentence)?.[1];
      const directPlacement = directCopyPlacement.exec(sentence)?.[1];
      if (decorations) {
        if (/икон|пиктограмм|значк|\bicons?\b|pictogram/iu.test(decorations)) {
          suppressIcons = true;
        }
        if (
          /полос|баннер|\bstrips?\b|\bbands?\b|banners?/iu.test(decorations)
        ) {
          suppressBands = true;
        }
        if (/плаш|\bpanels?\b/iu.test(decorations)) {
          captionBackground = "transparent";
        }
      }
      if (directPlacement) {
        appearance.background ??= directPlacement.trim();
        captionBackground = "transparent";
        continue;
      }
      const chosenBackground = backgroundChoice.exec(sentence)?.[1];
      const chosenInk = inkChoice.exec(sentence)?.[1];
      if (chosenBackground || chosenInk) {
        if (chosenBackground) {
          appearance.background = chosenBackground
            .trim()
            .replace(/[.!?]+$/u, "");
        }
        if (chosenInk) {
          captionColorInput = chosenInk;
        }
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
      if (
        captionColorInstruction.test(sentence) ||
        captionDefaultLabel.test(sentence.replace(/[.!?]+$/u, ""))
      ) {
        captionColorInput = sentence;
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
      const paletteSentence = sentence.replace(/^[\p{L}\p{M}-]{1,30},\s*/u, "");
      const paletteRole = paletteRoleLabels.find(([, label]) =>
        label.test(paletteSentence),
      );
      if (paletteRole && colorWord.test(paletteSentence)) {
        paletteRoles.set(paletteRole[0], paletteSentence);
        continue;
      }
      if (compositionNote.test(sentence)) {
        if (!appearance.composition?.includes(sentence)) {
          appearance.composition = [appearance.composition, sentence]
            .filter(Boolean)
            .join("\n");
        }
      } else if (compositionHint.test(sentence)) {
        if (
          /икон|пиктограмм|знач(?:ок|ки|ка)|\bicons?\b|pictogram/iu.test(
            sentence,
          ) &&
          !decorations
        ) {
          suppressIcons = false;
        }
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
        !sizeLabel.test(sentence) &&
        matchedPair(sentence, namedDimensionPattern) === undefined
      ) {
        caption = sentence;
      }
    }
    if (nextDetails) {
      captionDetails = [...new Set(nextDetails)];
    }
  }
  if (paletteRoles.size) {
    appearance.palette = [appearance.palette, ...paletteRoles.values()]
      .filter(Boolean)
      .join("\n");
  }
  if (caption === undefined && captionDetails.length) {
    caption = null;
  }
  const size =
    providerArtwork && pixels === undefined && aspect === undefined
      ? { width: 1024, height: 1024 }
      : dimensions(pixels, aspect);
  const firstReference = attachments.findIndex(
    ({ coverRole, mimeType }) =>
      coverRole === "style-reference" && rasterMimeTypes.has(mimeType),
  );
  const legacyPhotos =
    firstReference < 0 ? attachments : attachments.slice(0, firstReference);
  const photo =
    attachments.findLast(
      ({ coverRole, mimeType }) =>
        coverRole === "product-photo" && rasterMimeTypes.has(mimeType),
    ) ??
    legacyPhotos.findLast(
      ({ coverRole, mimeType }) =>
        coverRole === undefined && rasterMimeTypes.has(mimeType),
    );
  const styleReference = attachments.findLast(
    ({ coverRole, mimeType }) =>
      coverRole === "style-reference" && rasterMimeTypes.has(mimeType),
  );
  const font = attachments.findLast(isCoverFont);
  const issues: TCoverIssue[] = [];
  if (providerArtwork) {
    if (!size) {
      issues.push("size");
    }
    if (!photo) {
      issues.push("photo");
    }
    if (!size || !photo) {
      return { issues };
    }
    return {
      brief: {
        size,
        appearance,
        caption: caption ?? null,
        captionDetails: captionDetails.length ? captionDetails : undefined,
        photo,
        styleReference,
      },
    };
  }
  let captionColor =
    captionColorInput === undefined
      ? undefined
      : readCaptionColor(captionColorInput, paletteColors);
  if (!size) {
    issues.push("size");
  }
  if (
    (!styleReference && !Object.values(appearance).some(Boolean)) ||
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
      (!caption || caption.length > 90 || /[\p{Cc}\p{Cf}]/u.test(caption))) ||
    captionDetails.length > 6 ||
    captionDetails.some(
      (line) => line.length > 120 || /[\p{Cc}\p{Cf}]/u.test(line),
    )
  ) {
    issues.push("caption");
  }
  if ((caption || captionDetails.length) && !font) {
    issues.push("font");
  }
  if ((caption || captionDetails.length) && captionColor === null) {
    issues.push("caption-color");
  }
  if ((caption || captionDetails.length) && captionBackground === null) {
    issues.push("caption-background");
  }
  if (issues.length || !size || !photo || caption === undefined) {
    return { issues };
  }
  const hasCopy = Boolean(caption || captionDetails.length);
  if (
    hasCopy &&
    captionColor === undefined &&
    captionDefaults &&
    !styleReference
  ) {
    captionColor = defaultCaptionColor(captionDefaults, paletteColors);
  }
  return {
    brief: {
      size,
      appearance,
      caption,
      captionDetails: captionDetails.length ? captionDetails : undefined,
      captionColor: hasCopy ? (captionColor ?? undefined) : undefined,
      captionBackground: hasCopy ? (captionBackground ?? undefined) : undefined,
      suppressIcons: suppressIcons || undefined,
      suppressBands: suppressBands || undefined,
      photo,
      styleReference,
      font: hasCopy ? font : undefined,
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
        layoutVersion: brief.styleReference ? 4 : 2,
        size: brief.size,
        appearance: describeAppearance(brief.appearance),
        caption: brief.caption,
        captionDetails: brief.captionDetails,
        captionColor: brief.captionColor,
        captionBackground: brief.captionBackground,
        suppressIcons: brief.suppressIcons,
        suppressBands: brief.suppressBands,
        photo: [brief.photo.id, brief.photo.digest],
        styleReference: brief.styleReference && [
          brief.styleReference.id,
          brief.styleReference.digest,
        ],
        font: brief.font && [brief.font.id, brief.font.digest],
        productMode,
        skillGuidance: brief.styleReference ? undefined : skillGuidance,
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

/** Normalized source for image generation and visual questions on a chat reply. */
export async function prepareWorkSourceImage(bytes: Buffer, mimeType: string) {
  const format = rasterFormat(bytes);
  if (!format || format !== rasterMimeTypes.get(mimeType)) {
    throw new Error("Validation error. The source image format is invalid");
  }
  return sharp(bytes, { limitInputPixels: 16_000_000 })
    .rotate()
    .resize({
      width: 512,
      height: 512,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

async function readCoverRaster(
  bytes: Buffer,
  attachment: ICustomerWorkRunAttachment,
) {
  const format = rasterFormat(bytes);
  if (
    !format ||
    format !== rasterMimeTypes.get(attachment.mimeType) ||
    bytes.length > photoByteLimit
  ) {
    throw new Error("Unsupported cover image");
  }
  const photo = sharp(bytes, { failOn: "error", limitInputPixels: 24_000_000 });
  const metadata = await photo.metadata();
  if (
    metadata.format !== format ||
    (metadata.pages ?? 1) !== 1 ||
    (metadata.width ?? 0) < 16 ||
    (metadata.height ?? 0) < 16
  ) {
    throw new Error("Unsupported cover image");
  }
  const alpha = metadata.hasAlpha
    ? (await photo.stats()).channels.at(-1)
    : undefined;
  if (alpha?.max === 0) {
    throw new Error("The cover image is fully transparent");
  }
  return { photo, alpha, format };
}

export async function prepareCoverReference(
  bytes: Buffer,
  attachment: ICustomerWorkRunAttachment,
) {
  const { photo } = await readCoverRaster(bytes, attachment);
  return photo
    .rotate()
    .resize({
      width: 768,
      height: 768,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#F6F6F6" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function originalCoverReference(
  bytes: Buffer,
  attachment: ICustomerWorkRunAttachment,
) {
  const { photo, alpha, format } = await readCoverRaster(bytes, attachment);
  if (!alpha) {
    await photo.stats();
  }
  return { bytes, mimeType: `image/${format}` as const };
}

export async function prepareCoverPhoto(
  bytes: Buffer,
  brief: ICoverBrief,
  allowEdit: boolean,
): Promise<{ product: OverlayOptions } | { sourceImage: Uint8Array }> {
  const { photo, alpha } = await readCoverRaster(bytes, brief.photo);
  if (allowEdit) {
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
  const data = await photo
    .rotate()
    .resize({ width, height, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  return { product: { input: data } };
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

function luminance([red, green, blue]: readonly number[]) {
  const linear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function hexLuminance(hex: string) {
  const color = exactColors(hex)[0] ?? "#172A21";
  const value = Number.parseInt(color.slice(1), 16);
  return luminance([value >> 16, (value >> 8) & 255, value & 255]);
}

function contrast(ink: number, background: number) {
  return (
    (Math.max(ink, background) + 0.05) / (Math.min(ink, background) + 0.05)
  );
}

async function rasterCaption(
  bytes: Buffer,
  brief: ICoverBrief,
  width: number,
  height: number,
  ink: string,
) {
  const { caption, captionDetails = [] } = brief;
  const displaySize = Math.min(
    brief.size.width * 0.058,
    brief.size.height * 0.082,
  );
  const detailSize = Math.min(
    brief.size.width * 0.032,
    brief.size.height * 0.043,
  );
  let scale = 1;
  for (const pass of [1, 2, 3, 4]) {
    const headline = Math.max(15, Math.round(displaySize * scale));
    const body = Math.max(12, Math.round(detailSize * scale));
    const svg = await satori(
      createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            width,
            color: ink,
            fontFamily: "BuyerCoverFont",
            gap: Math.max(4, Math.round(body * 0.3)),
          },
        },
        caption &&
          createElement(
            "div",
            {
              style: {
                fontSize: headline,
                lineHeight: 1.12,
                overflowWrap: "break-word",
              },
            },
            caption,
          ),
        ...captionDetails.map((line, key) =>
          createElement(
            "div",
            {
              key,
              style: {
                fontSize: body,
                lineHeight: 1.28,
                overflowWrap: "break-word",
              },
            },
            line,
          ),
        ),
      ),
      {
        width,
        fonts: [{ name: "BuyerCoverFont", data: bytes }],
        loadAdditionalAsset: async () => {
          throw new Error("The font does not cover the requested caption");
        },
      },
    );
    const raster = await sharp(Buffer.from(svg)).ensureAlpha().png().toBuffer();
    const tight = await sharp(raster)
      .trim({ background: "#00000000", threshold: 1, lineArt: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    if (tight.info.width <= width && tight.info.height <= height) {
      return tight;
    }
    if (pass < 4) {
      scale *= Math.min(0.92, (height / tight.info.height) * 0.96);
    }
  }
  throw new CoverCopyDoesNotFit("The copy does not fit at a readable size");
}

export async function captionLayer(
  bytes: Buffer,
  brief: ICoverBrief,
): Promise<ICoverCaptionLayer> {
  if (!brief.caption && !brief.captionDetails?.length) {
    throw new Error("Missing caption text");
  }
  verifyFontTables(bytes);
  const { width, height } = brief.size;
  const side = Math.round(width * 0.075);
  const bottom = Math.round(height * 0.06);
  const panel = brief.captionBackground === "panel";
  const padding = panel ? Math.round(Math.min(width, height) * 0.026) : 3;
  const fill = exactColors(brief.appearance.background ?? "");
  const ink =
    brief.captionColor ??
    (fill.length === 1 && hexLuminance(fill[0]) < 0.22 ? "#F8F7F3" : "#172A21");
  const { data, info } = await rasterCaption(
    bytes,
    brief,
    width - 2 * side - 2 * padding,
    Math.round(height * 0.41) - bottom - 2 * padding,
    ink,
  );
  const overlayWidth = info.width + 2 * padding;
  const overlayHeight = info.height + 2 * padding;
  let input: Buffer;
  if (panel) {
    const inkValue = hexLuminance(ink);
    const panelColor =
      fill.length === 1 && contrast(inkValue, hexLuminance(fill[0])) >= 4.5
        ? fill[0]
        : inkValue > 0.3
          ? "#242926"
          : "#F6F4EF";
    input = await sharp({
      create: {
        width: overlayWidth,
        height: overlayHeight,
        channels: 4,
        background: panelColor,
      },
    })
      .composite([{ input: data, left: padding, top: padding }])
      .png()
      .toBuffer();
  } else {
    input = await sharp(data)
      .extend({
        top: padding,
        right: padding,
        bottom: padding,
        left: padding,
        background: "#00000000",
      })
      .png()
      .toBuffer();
  }
  return {
    input,
    left: side,
    top: height - bottom - overlayHeight,
    ink,
    panel,
  };
}

export async function prepareCoverFontSample(
  bytes: Buffer,
  brief: ICoverBrief,
) {
  const caption = await captionLayer(bytes, {
    ...brief,
    size: { width: 1024, height: 1024 },
    captionColor: "#161616",
    captionBackground: "transparent",
  });
  return sharp(caption.input)
    .resize({
      width: 768,
      height: 768,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#FFFFFF" })
    .jpeg({ quality: 92 })
    .toBuffer();
}

async function framedArtwork(
  background: Uint8Array,
  size: ICoverSize,
  artworkHeight: number,
) {
  const { width, height } = size;
  const scene = await sharp(background, {
    failOn: "error",
    limitInputPixels: 1_100_000,
  })
    .resize({ width, height: artworkHeight, fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const top = Math.floor((artworkHeight - scene.info.height) / 2);
  const left = Math.floor((width - scene.info.width) / 2);
  const right = width - scene.info.width - left;
  const bottom = height - scene.info.height - top;
  const extension = Math.max(top, right, bottom, left);
  if (!extension) {
    return scene.data;
  }

  // Continue the edge colors under the layout, then restore the entire image.
  const matte = await sharp(scene.data)
    .extend({ top, right, bottom, left, extendWith: "copy" })
    .png()
    .toBuffer();
  if (extension <= 6) {
    return matte;
  }
  const softened = await sharp(matte)
    .blur(Math.max(1, Math.min(22, extension / 18)))
    .png()
    .toBuffer();
  return sharp(softened)
    .composite([{ input: scene.data, top, left }])
    .png()
    .toBuffer();
}

async function productOnCanvas(
  product: OverlayOptions,
  width: number,
  artworkHeight: number,
): Promise<OverlayOptions> {
  if (!Buffer.isBuffer(product.input)) {
    return product;
  }
  const photo = await sharp(product.input)
    .resize({
      width: Math.round(width * 0.84),
      height: Math.round(artworkHeight * 0.84),
      fit: "inside",
    })
    .png()
    .toBuffer({ resolveWithObject: true });
  return {
    input: photo.data,
    left: Math.floor((width - photo.info.width) / 2),
    top: Math.floor((artworkHeight - photo.info.height) / 2),
  };
}

async function legibleCaption(
  base: Buffer,
  layer: ICoverCaptionLayer,
): Promise<OverlayOptions> {
  const { ink, panel, ...overlay } = layer;
  const { input, left, top } = overlay;
  if (
    !ink ||
    panel ||
    !Buffer.isBuffer(input) ||
    left === undefined ||
    top === undefined
  ) {
    return overlay;
  }
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) {
    return overlay;
  }
  const region = await sharp(base)
    .extract({ top, left, width, height })
    .resize(1, 1)
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer();
  const inkValue = hexLuminance(ink);
  if (contrast(inkValue, luminance([...region])) >= 4.5) {
    return overlay;
  }
  const glyphs = await sharp(input).extractChannel("alpha").raw().toBuffer();
  const alpha = Buffer.alloc(glyphs.length);
  for (let row = 1; row < height - 1; row += 1) {
    for (let column = 1; column < width - 1; column += 1) {
      const index = row * width + column;
      alpha[index] = Math.max(
        glyphs[index],
        glyphs[index - 1],
        glyphs[index + 1],
        glyphs[index - width],
        glyphs[index + width],
      );
    }
  }
  const halo = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: inkValue > 0.3 ? "#161A17" : "#FFFDF8",
    },
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  const strengthened = await sharp(halo)
    .composite([{ input, top: 0, left: 0 }])
    .png()
    .toBuffer();
  return { ...overlay, input: strengthened };
}

export async function composeCover(
  background: Uint8Array,
  layers: ICoverLayers,
) {
  const { width, height } = layers.size;
  const artworkHeight =
    layers.caption?.top === undefined
      ? height
      : Math.max(1, layers.caption.top - Math.round(height * 0.035));
  let base = await framedArtwork(background, layers.size, height);
  if (layers.product) {
    const product = await productOnCanvas(layers.product, width, artworkHeight);
    base = await sharp(base).composite([product]).png().toBuffer();
  }
  if (layers.caption) {
    const caption = await legibleCaption(base, layers.caption);
    return sharp(base).composite([caption]).png().toBuffer();
  }
  return base;
}
