interface IWebsiteAsset {
  id: string;
  src: string;
  alt: string;
}

interface ILandingArtwork {
  hero: IWebsiteAsset;
  modules: IWebsiteAsset[];
}

export interface IWebsiteItem {
  title: string;
  text: string;
}

interface IWebsiteLink {
  text: string;
  href: string;
}

interface IWebsiteSection {
  title: string;
  paragraphs: string[];
  items: IWebsiteItem[];
  links: IWebsiteLink[];
  quote: string;
}

export interface ICodeFrameworkWebsiteContent {
  hero: IWebsiteSection;
  foundation: IWebsiteSection;
  journey: IWebsiteSection;
  request: IWebsiteSection;
  change: IWebsiteSection;
  chat: IWebsiteSection;
  modules: IWebsiteSection;
  articles: IWebsiteSection;
  handoff: IWebsiteSection;
  price: IWebsiteSection;
  questions: IWebsiteSection;
  footer: IWebsiteSection;
  labels: Record<string, string>;
}

const generated = "/workspace-assets/singlepage/generated/living-focus";

const acquisition =
  "/workspace-assets/singlepage/generated/framework-acquisition-v2";

/** Product-only artwork; the existing Modules/runtime asset choices are untouched. */
export const landingArtwork: ILandingArtwork = {
  hero: {
    id: "singlepage-generated-framework-acquisition-v2-hero",
    src: `${acquisition}/hero.png`,
    alt: "A website assembled from ready-made account, shop and article features.",
  },
  modules: [
    "accounts",
    "social",
    "blog",
    "knowledge",
    "ecommerce",
    "billing",
    "pages",
    "forms",
  ].map((key) => ({
    id:
      key === "knowledge"
        ? "singlepage-generated-framework-webinar-v1-knowledge-ai"
        : `singlepage-generated-framework-acquisition-v2-${key}`,
    src:
      key === "knowledge"
        ? "/workspace-assets/singlepage/generated/framework-webinar-v1/knowledge-ai.png"
        : `${acquisition}/${key}.png`,
    alt: "",
  })),
};

/** Asset choices only. All visible page copy is authored in page.md. */
export const websiteAssets: Record<
  "logo" | "photograph" | "modules" | "agents",
  IWebsiteAsset
> = {
  logo: {
    id: "singlepage-generated-living-focus-primary-lockup",
    src: `${generated}/singlepagestartup-primary-lockup.svg`,
    alt: "SinglePageStartup",
  },
  photograph: {
    id: "singlepage-generated-living-focus-photography-business-conversation-square",
    src: `${generated}/singlepagestartup-photography-business-conversation-square.png`,
    alt: "Editorial image of two people exchanging an idea at a worktable.",
  },
  modules: {
    id: "singlepage-generated-living-focus-illustration-module-hierarchy-cool-square",
    src: `${generated}/singlepagestartup-illustration-module-hierarchy-cool-square.png`,
    alt: "Conceptual drawing of reusable modules connected to a common software foundation.",
  },
  agents: {
    id: "singlepage-generated-living-focus-illustration-coordinated-agents-cool-square",
    src: `${generated}/singlepagestartup-illustration-coordinated-agents-cool-square.png`,
    alt: "Conceptual drawing of a person directing coding assistants toward a shared task.",
  },
};

function parseSection(markdown: string): IWebsiteSection {
  const title = markdown.match(/^#{1,6}\s+(.+)$/m)?.[1] ?? "";
  const paragraphs = markdown
    .trim()
    .split(/\n\s*\n/)
    .filter((block) => !/^(#|\||>|\[)/.test(block.trim()))
    .map((block) => block.trim().replace(/\n/g, " "));
  const table = markdown
    .split("\n")
    .filter((line) => line.trim().startsWith("|"));
  const items = table.slice(2).map((line) => {
    const [title = "", text = ""] = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    return { title, text };
  });
  const links = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)].map(
    (match) => ({ text: match[1], href: match[2] }),
  );
  const quote = markdown
    .split("\n")
    .filter((line) => line.startsWith("> "))
    .map((line) => line.slice(2))
    .join(" ");
  return { title, paragraphs, items, links, quote };
}

/** Stable comments bind the layout; operators may edit the actual headings and copy. */
export function parseCodeFrameworkWebsite(
  text: string,
): ICodeFrameworkWebsiteContent {
  const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
  const parts = body.split(/<!--\s*section:\s*([\w-]+)\s*-->/);
  const sections: Record<string, IWebsiteSection> = {};
  for (let index = 1; index < parts.length; index += 2) {
    sections[parts[index]] = parseSection(parts[index + 1] ?? "");
  }
  const section = (id: string): IWebsiteSection => {
    if (!sections[id])
      throw new Error(
        `Code Framework landing text is missing its ${id} section.`,
      );
    return sections[id];
  };
  return {
    hero: section("hero"),
    foundation: section("foundation"),
    journey: section("journey"),
    request: section("request"),
    change: section("change"),
    chat: section("chat"),
    modules: section("modules"),
    articles: section("articles"),
    handoff: section("handoff"),
    price: section("price"),
    questions: section("questions"),
    footer: section("footer"),
    labels: Object.fromEntries(
      section("controls").items.map(({ title, text }) => [title, text]),
    ),
  };
}
