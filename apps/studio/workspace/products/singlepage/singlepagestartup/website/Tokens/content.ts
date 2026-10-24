export interface ITokenPageSection {
  title: string;
  paragraphs: string[];
}

export interface ITokenPackage {
  amount: number;
  rate: number;
}

export interface ITokenPageContent {
  hero: ITokenPageSection;
  allowance: ITokenPageSection;
  pro: ITokenPageSection & {
    prices: Record<"USD" | "RUB", number>;
    monthlyTokens: number;
  };
  topups: ITokenPageSection & { packages: ITokenPackage[] };
  handoff: ITokenPageSection;
  terms: ITokenPageSection;
  framework: ITokenPageSection;
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

function readCopy(text: string): ITokenPageSection {
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

export function parseTokenPage(text: string): ITokenPageContent {
  const section = (name: string) => readSection(text, name);
  const pro = Object.fromEntries(readRows(section("pro")));
  return {
    hero: readCopy(section("hero")),
    allowance: readCopy(section("allowance")),
    pro: {
      ...readCopy(section("pro")),
      prices: {
        USD: Number(pro["usd-monthly"]),
        RUB: Number(pro["rub-monthly"]),
      },
      monthlyTokens: Number(pro["monthly-tokens"]),
    },
    topups: {
      ...readCopy(section("topups")),
      packages: readRows(section("topups")).map(([amount, rate]) => ({
        amount: Number(amount),
        rate: Number(rate),
      })),
    },
    handoff: readCopy(section("handoff")),
    terms: readCopy(section("terms")),
    framework: readCopy(section("framework")),
    labels: Object.fromEntries(readRows(section("controls"))),
  };
}

export function tokenCredit({ amount, rate }: ITokenPackage): number {
  return Math.floor((amount / rate) * 1_000_000) / 1_000_000;
}
