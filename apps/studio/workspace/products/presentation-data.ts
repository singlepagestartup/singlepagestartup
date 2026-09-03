import type { IProjectDesignData } from "../components/ProjectDesign";
import { projectDesignData } from "../design/data";
import type { IStudioWorkspace } from "../types";

export type ProjectPresentationProjection = "singlepage" | "startup";

export interface IProjectPresentationRisk {
  boundary: string;
  consequence: string;
  title: string;
}

export interface IProjectPresentationSignal {
  detail: string;
  title: string;
}

export interface IProjectPresentationData {
  acquisition: string;
  audience: string;
  brand: {
    character: string[];
    doDont: Array<{ do: string; dont: string }>;
    idea: string;
    primaryLogoUrl?: string;
  };
  experiment: {
    assumption: string;
    budget: string;
    facts: string[];
    minimumSignal: string;
    negativeDecision: string;
    positiveDecision: string;
    stopRule: string;
  };
  modules: string[];
  name: string;
  nonGoals: string;
  offer: string;
  positioning: string;
  productLogic: string;
  projection: ProjectPresentationProjection;
  proof: string;
  promise: string;
  risks: IProjectPresentationRisk[];
  showcase: {
    description: string;
    outcome: string;
    status: string;
    steps: string[];
  };
  signals: IProjectPresentationSignal[];
  trigger: string;
  visual: IProjectDesignData;
}

export interface IProjectPresentationWorkspaces {
  default: IStudioWorkspace;
  singlepage: IStudioWorkspace;
  startup: IStudioWorkspace;
}

function artifact(workspace: IStudioWorkspace, kind: string): string {
  return (
    workspace.artifacts.find((candidate) => candidate.kind === kind)?.content ??
    ""
  );
}

function clean(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function meaningfulMarkdown(source: string): boolean {
  return source
    .split("\n")
    .some((line) => line.trim() && !/^#{1,6}\s/.test(line.trim()));
}

function section(source: string, heading: string): string {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => {
    const match = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    return match?.[2].toLocaleLowerCase() === heading.toLocaleLowerCase();
  });
  if (start < 0) return "";
  const level = lines[start].match(/^(#+)/)?.[1].length ?? 3;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const nextLevel = lines[index].match(/^(#+)\s+/)?.[1].length;
    if (nextLevel != null && nextLevel <= level) {
      end = index;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join("\n")
    .trim();
}

function tableRows(source: string, heading?: string): string[][] {
  const target = heading ? section(source, heading) : source;
  return target
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .map((line) => line.split("|").slice(1, -1).map(clean))
    .filter(
      (cells) =>
        cells.length > 1 &&
        !cells.every((cell) => /^:?-{3,}:?$/.test(cell)) &&
        !["field", "decision", "risk or missing evidence"].includes(
          cells[0].toLocaleLowerCase(),
        ),
    );
}

function tableValue(source: string, label: string): string {
  const row = tableRows(source).find(
    (cells) => cells[0].toLocaleLowerCase() === label.toLocaleLowerCase(),
  );
  return row?.[1] ?? "";
}

function paragraph(source: string, heading: string): string {
  const target = section(source, heading);
  const blocks = target
    .split(/\n\s*\n/)
    .map((block) => clean(block.replace(/^>\s?/gm, "")))
    .filter(
      (block) =>
        block &&
        !block.startsWith("|") &&
        !block.startsWith("-") &&
        !block.startsWith("#"),
    );
  return blocks[0] ?? "";
}

function blockquote(source: string, heading: string): string {
  const target = section(source, heading);
  return clean(
    target
      .split("\n")
      .filter((line) => line.trim().startsWith(">"))
      .map((line) => line.replace(/^\s*>\s?/, ""))
      .join(" "),
  );
}

function sentenceContaining(source: string, phrase: string): string {
  const normalized = clean(source);
  const sentences = normalized.match(/[^.!?]+[.!?]+/g) ?? [];
  const index = sentences.findIndex((sentence) =>
    sentence.toLocaleLowerCase().includes(phrase.toLocaleLowerCase()),
  );
  return index >= 0
    ? clean(`${sentences[index]} ${sentences[index + 1] ?? ""}`)
    : "";
}

function evidenceClaim(source: string, id: string): string {
  const row = tableRows(source).find((cells) => cells[0] === id);
  return row?.[4] ?? "";
}

function compact(value: string, maximum = 430): string {
  const normalized = clean(value);
  if (normalized.length <= maximum) return normalized;
  const sentences = normalized.match(/[^.!?]+[.!?]+/g) ?? [];
  let result = "";
  for (const sentence of sentences) {
    if (`${result} ${sentence}`.trim().length > maximum) break;
    result = `${result} ${sentence}`.trim();
  }
  if (result) return result;
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`;
}

function projectName(brief: string, projection: ProjectPresentationProjection) {
  return (
    brief.match(/Develop and market\s+([A-Z][A-Za-z0-9]+)/)?.[1] ??
    brief.match(/([A-Z][A-Za-z0-9]+) itself is the primary product/)?.[1] ??
    (projection === "singlepage" ? "SinglePageStartup" : "Startup project")
  );
}

function moduleInventory(evidence: string): string[] {
  const claim = evidenceClaim(evidence, "SP-EV-022");
  const inventory = claim.match(/README files:\s*([^\.]+)\./)?.[1] ?? "";
  return inventory
    .replace(/,\s+and\s+/g, ", ")
    .split(",")
    .map(clean)
    .filter(Boolean);
}

function signalLadder(strategy: string): IProjectPresentationSignal[] {
  const value = tableValue(strategy, "Expected behavior");
  const sequence = value.split(":").slice(1).join(":");
  return sequence
    .split(";")
    .map(clean)
    .filter(Boolean)
    .map((item) => {
      const match = item.match(
        /^(demonstration-service usage|repository attention|evaluation intent|successful use|adoption)\s*(.*)$/i,
      );
      const title = clean(match?.[1] ?? item);
      const parsedDetail = clean(
        match?.[2]?.replace(
          /^shown only by\s+|^shown by\s+|^such as\s+|^only by\s+/i,
          "",
        ) ?? item,
      );
      return {
        detail: compact(
          parsedDetail || "tracked service activity; not framework adoption",
          180,
        ),
        title,
      };
    });
}

function experimentFacts(budget: string): string[] {
  const facts: string[] = [];
  if (/three calendar weeks/i.test(budget)) facts.push("3 weeks");
  if (/six founder hours per week/i.test(budget)) facts.push("6 h / week");
  if (/18 total/i.test(budget)) facts.push("18 h total");
  if (/USD 0 paid media/i.test(budget)) facts.push("$0 paid media");
  if (/USD 200 aggregate/i.test(budget)) facts.push("$200 token subsidy");
  if (/USD 1 per promotional user per day/i.test(budget)) {
    facts.push("$1 / promo user / day");
  }
  return facts;
}

function brandCharacter(brand: string): string[] {
  const target = section(brand, "Intended perception");
  const character = target.match(/character is\s+\*\*([^*]+)\*\*/i)?.[1] ?? "";
  return character
    .replace(/,\s+and\s+/g, ", ")
    .split(",")
    .map(clean)
    .filter(Boolean);
}

function brandRules(brand: string): Array<{ do: string; dont: string }> {
  return tableRows(brand, "Do and do not")
    .filter((cells) => cells[0].toLocaleLowerCase() !== "do")
    .slice(0, 4)
    .map((cells) => ({ do: cells[0], dont: cells[1] }));
}

function primaryLogoUrl(visual: IProjectDesignData): string | undefined {
  return visual.assets.find(
    (asset) =>
      asset.previewUrl &&
      (asset.id.includes("primary-lockup") ||
        asset.path.includes("primary-lockup")),
  )?.previewUrl;
}

function presentationData(
  workspace: IStudioWorkspace,
  projection: ProjectPresentationProjection,
): IProjectPresentationData {
  const brief = artifact(workspace, "brief");
  const business = artifact(workspace, "business");
  const strategy = artifact(workspace, "strategy");
  const brand = artifact(workspace, "brand");
  const evidence = artifact(workspace, "evidence");
  const visual = projectDesignData(workspace, projection);
  const budget = tableValue(strategy, "Budget and time limit");
  const riskRows = tableRows(strategy, "Risks and missing evidence");

  return {
    acquisition: compact(tableValue(strategy, "Acquisition focus"), 520),
    audience: compact(tableValue(strategy, "Audience and situation"), 520),
    brand: {
      character: brandCharacter(brand),
      doDont: brandRules(brand),
      idea: compact(paragraph(brand, "Intended perception"), 520),
      primaryLogoUrl: primaryLogoUrl(visual),
    },
    experiment: {
      assumption: compact(tableValue(strategy, "Critical assumption"), 400),
      budget: compact(budget, 520),
      facts: experimentFacts(budget),
      minimumSignal: compact(
        tableValue(strategy, "Minimum useful signal"),
        330,
      ),
      negativeDecision: compact(tableValue(strategy, "Negative decision"), 380),
      positiveDecision: compact(tableValue(strategy, "Positive decision"), 380),
      stopRule: compact(tableValue(strategy, "Stop rule"), 460),
    },
    modules: moduleInventory(evidence),
    name: projectName(brief, projection),
    nonGoals: compact(
      tableValue(strategy, "Non-goals and rejected options"),
      520,
    ),
    offer: compact(tableValue(strategy, "Offer"), 520),
    positioning: compact(tableValue(strategy, "Positioning"), 520),
    productLogic: compact(tableValue(strategy, "Commercial logic"), 520),
    projection,
    proof: compact(tableValue(strategy, "Proof available now"), 520),
    promise:
      compact(tableValue(brand, "Promise"), 360) ||
      compact(tableValue(strategy, "Positioning"), 360),
    risks: riskRows.slice(0, 5).map((row) => ({
      boundary: compact(row[1], 240),
      consequence: compact(row[2], 240),
      title: row[0],
    })),
    showcase: {
      description: compact(tableValue(business, "Separate service"), 680),
      outcome: compact(tableValue(business, "Success unit"), 420),
      status: compact(evidenceClaim(evidence, "SP-EV-009"), 420),
      steps: [
        "Discover the service",
        "Evaluate an agent and its knowledge boundary",
        "Register a profile",
        "Use a promotional grant or paid access",
        "Ask one question in chat",
        "Receive one agent answer",
        "Repeat, seek support, or leave",
      ],
    },
    signals: signalLadder(strategy),
    trigger: compact(tableValue(strategy, "Problem and trigger"), 520),
    visual,
  };
}

export function hasProjectPresentationData(
  workspace: IStudioWorkspace,
): boolean {
  return ["brief", "business", "strategy", "brand", "evidence"].some((kind) =>
    meaningfulMarkdown(artifact(workspace, kind)),
  );
}

export function resolvedProjectPresentationData({
  default: resolved,
  singlepage,
  startup,
}: IProjectPresentationWorkspaces): IProjectPresentationData {
  return hasProjectPresentationData(startup)
    ? presentationData(resolved, "startup")
    : presentationData(singlepage, "singlepage");
}

export { presentationData as projectPresentationData };
