export type ProCurrency = "USD" | "RUB";

export interface IProPageSection {
  title: string;
  paragraphs: string[];
}

export interface IProPageContent {
  hero: IProPageSection;
  plan: IProPageSection & {
    prices: Record<ProCurrency, number>;
    monthlyTokens: number;
  };
  includes: IProPageSection;
  terms: IProPageSection;
  preview: IProPageSection;
  review: IProPageSection;
  labels: Record<string, string>;
}

function readSection(text: string, name: string): string {
  return (
    text
      .split(`<!-- section: ${name} -->`)[1]
      ?.split("<!-- section:")[0]
      .trim() ?? ""
  );
}

function readCopy(text: string): IProPageSection {
  return {
    title: text.match(/^## (.+)$/m)?.[1] ?? "",
    paragraphs: text
      .replace(/^## .+$/m, "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph && !paragraph.startsWith("|")),
  };
}

function readRows(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .slice(2)
    .map((line) =>
      line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim()),
    );
}

export function parseProPage(text: string): IProPageContent {
  const section = (name: string) => readSection(text, name);
  const plan = Object.fromEntries(readRows(section("plan")));
  return {
    hero: readCopy(section("hero")),
    plan: {
      ...readCopy(section("plan")),
      prices: {
        USD: Number(plan["usd-monthly"]),
        RUB: Number(plan["rub-monthly"]),
      },
      monthlyTokens: Number(plan["monthly-tokens"]),
    },
    includes: readCopy(section("includes")),
    terms: readCopy(section("terms")),
    preview: readCopy(section("preview")),
    review: readCopy(section("review")),
    labels: Object.fromEntries(readRows(section("controls"))),
  };
}

export function proCurrencyFromHref(href?: string): ProCurrency {
  if (!href) return "USD";
  try {
    return new URL(href, "https://studio.invalid").searchParams.get(
      "currency",
    ) === "RUB"
      ? "RUB"
      : "USD";
  } catch {
    return "USD";
  }
}
