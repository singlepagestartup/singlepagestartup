import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

interface IFrontmatter {
  body: string;
  fields: Map<string, string>;
}

interface IFailure {
  file: string;
  rule: string;
  evidence: string;
}

const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
const failures: IFailure[] = [];

function relative(filePath: string) {
  return path.relative(repositoryRoot, filePath).split(path.sep).join("/");
}

function filesBelow(root: string, extension: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .flatMap((name) => {
      const filePath = path.join(root, name);
      return statSync(filePath).isDirectory()
        ? filesBelow(filePath, extension)
        : filePath.endsWith(extension)
          ? [filePath]
          : [];
    })
    .sort();
}

function parseFrontmatter(source: string): IFrontmatter {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  const fields = new Map<string, string>();
  if (!match) return { body: source, fields };
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator > 0) {
      fields.set(
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim(),
      );
    }
  }
  return { body: source.slice(match[0].length), fields };
}

function wordCount(source: string) {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[^\p{L}\p{N}'-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function report(file: string, rule: string, evidence: string) {
  failures.push({ file: relative(file), rule, evidence });
}

function canonicalPointer(source: string) {
  return source.match(/(?:Canonical source|Canonical role): `([^`]+)`/)?.[1];
}

function validateAdapters() {
  const adapterGroups = [
    ...filesBelow(path.join(repositoryRoot, ".claude/commands"), ".md").filter(
      (file) => path.basename(file) !== "README.md",
    ),
    ...filesBelow(path.join(repositoryRoot, ".claude/references"), ".md"),
    ...filesBelow(path.join(repositoryRoot, ".claude/agents"), ".md"),
    ...filesBelow(path.join(repositoryRoot, ".codex/skills"), ".md"),
    ...filesBelow(path.join(repositoryRoot, ".codex/agents"), ".toml"),
  ];

  for (const file of adapterGroups) {
    const source = readFileSync(file, "utf8");
    const pointer = canonicalPointer(source);
    if (!pointer) {
      report(
        file,
        "adapter-pointer",
        "missing canonical source or role pointer",
      );
      continue;
    }
    const canonicalFile = path.join(repositoryRoot, pointer);
    if (!existsSync(canonicalFile)) {
      report(file, "adapter-target", `missing target ${pointer}`);
      continue;
    }
    const canonicalBody = parseFrontmatter(
      readFileSync(canonicalFile, "utf8"),
    ).body;
    const signature = canonicalBody.replace(/\s+/g, " ").trim().slice(0, 180);
    if (
      signature.length >= 120 &&
      source.replace(/\s+/g, " ").includes(signature)
    ) {
      report(
        file,
        "copied-canonical-body",
        `contains canonical text from ${pointer}`,
      );
    }
  }
}

function roleKnowledgeIds(frontmatter: string | undefined) {
  if (!frontmatter) return [];
  const bracketed = frontmatter.match(/^\[(.*)]$/)?.[1] ?? "";
  return bracketed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateRoles() {
  const rolesRoot = path.join(repositoryRoot, ".agents/roles");
  const roleFiles = filesBelow(rolesRoot, ".md");
  const workspaceIndexPath = path.join(
    repositoryRoot,
    "workspace/singlepage/index.yaml",
  );
  const workspaceIndex = parse(readFileSync(workspaceIndexPath, "utf8")) as {
    entries?: Array<{ id?: unknown; path?: unknown }>;
  };
  const knowledgePaths = new Map(
    (workspaceIndex.entries ?? [])
      .filter(
        (entry): entry is { id: string; path: string } =>
          typeof entry.id === "string" && typeof entry.path === "string",
      )
      .map((entry) => [
        entry.id,
        path.join(repositoryRoot, "workspace/singlepage", entry.path),
      ]),
  );
  const directFiles = readdirSync(rolesRoot).filter(
    (name) =>
      statSync(path.join(rolesRoot, name)).isFile() && name.endsWith(".md"),
  ).length;
  if (roleFiles.length !== directFiles) {
    report(
      rolesRoot,
      "flat-role-directory",
      "role files must not use subdirectories",
    );
  }

  const ids = new Map<string, string>();
  const forbidden = [
    /^##\s+(persona|biography|backstory|memory|character)\b/im,
    /fictional biography/i,
    /invented (experience|memory)/i,
    /personality theatre/i,
    /role[- ]play monologue/i,
  ];
  const workflowAndTemplates = [
    ...filesBelow(path.join(repositoryRoot, ".agents/workflows"), ".md"),
    ...filesBelow(
      path.join(repositoryRoot, "workspace/singlepage/templates"),
      ".md",
    ),
  ].map((file) => readFileSync(file, "utf8"));

  for (const file of roleFiles) {
    const source = readFileSync(file, "utf8");
    const parsed = parseFrontmatter(source);
    const id = parsed.fields.get("id") ?? path.basename(file, ".md");
    if (ids.has(id)) {
      report(
        file,
        "unique-role-id",
        `duplicate id ${id}; first seen in ${ids.get(id)}`,
      );
    } else {
      ids.set(id, relative(file));
    }
    if (path.basename(file, ".md") !== id) {
      report(
        file,
        "profession-file-name",
        `file name must match role id ${id}`,
      );
    }
    const words = wordCount(parsed.body);
    if (words > 700)
      report(file, "role-word-limit", `${words} words; maximum is 700`);
    for (const pattern of forbidden) {
      if (pattern.test(parsed.body)) {
        report(file, "forbidden-role-theatre", `matched ${pattern}`);
      }
    }
    for (const knowledgeId of roleKnowledgeIds(
      parsed.fields.get("knowledge"),
    )) {
      const knowledgePath = knowledgePaths.get(knowledgeId);
      if (!knowledgePath || !existsSync(knowledgePath)) {
        report(
          file,
          "missing-on-demand-knowledge",
          `${knowledgeId} -> ${knowledgePath ? relative(knowledgePath) : "not indexed"}`,
        );
      }
    }

    const paragraphs = parsed.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .filter((paragraph) => paragraph.length >= 180);
    for (const paragraph of paragraphs) {
      if (
        workflowAndTemplates.some((sourceText) =>
          sourceText.replace(/\s+/g, " ").includes(paragraph),
        )
      ) {
        report(
          file,
          "duplicated-workflow-or-template",
          paragraph.slice(0, 100),
        );
        break;
      }
    }
  }

  const requiredPreDevelopment = [
    "account-manager",
    "business-analyst",
    "market-researcher",
    "strategist",
    "communication-strategist",
    "brand-designer",
    "web-designer",
  ];
  for (const id of requiredPreDevelopment) {
    if (!ids.has(id)) report(rolesRoot, "required-role", `missing ${id}.md`);
  }
}

function parseActiveLayer(source: string) {
  return source.match(/^active_layer:\s*(auto|singlepage|startup)\s*$/m)?.[1];
}

function resolveLayer(repository: string, localConfig?: string) {
  const override = localConfig ? parseActiveLayer(localConfig) : "auto";
  if (override === "singlepage" || override === "startup") return override;
  return repository === "singlepagestartup/singlepagestartup"
    ? "singlepage"
    : "startup";
}

function validateWorkspaceSelection() {
  const exampleFile = path.join(
    repositoryRoot,
    "workspace/config.example.yaml",
  );
  const ignoreFile = path.join(repositoryRoot, ".gitignore");
  const example = readFileSync(exampleFile, "utf8");
  if (parseActiveLayer(example) !== "auto") {
    report(
      exampleFile,
      "workspace-config",
      "example must default to active_layer: auto",
    );
  }
  if (resolveLayer("singlepagestartup/singlepagestartup") !== "singlepage") {
    report(
      exampleFile,
      "canonical-layer",
      "canonical repository must resolve singlepage",
    );
  }
  if (resolveLayer("example/downstream") !== "startup") {
    report(
      exampleFile,
      "downstream-layer",
      "downstream repository must resolve startup",
    );
  }
  if (
    resolveLayer("example/downstream", "active_layer: singlepage\n") !==
    "singlepage"
  ) {
    report(
      exampleFile,
      "local-override",
      "local override must win over repository identity",
    );
  }
  if (
    !readFileSync(ignoreFile, "utf8").includes("workspace/config.local.yaml")
  ) {
    report(
      ignoreFile,
      "local-override-ignore",
      "workspace/config.local.yaml must be gitignored",
    );
  }
}

validateAdapters();
validateRoles();
validateWorkspaceSelection();

if (failures.length > 0) {
  console.error(`Agent validation failed with ${failures.length} finding(s):`);
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.rule}: ${failure.evidence}`);
  }
  process.exit(1);
}

const roleSummary = filesBelow(
  path.join(repositoryRoot, ".agents/roles"),
  ".md",
)
  .map(
    (file) =>
      `${relative(file)}=${wordCount(parseFrontmatter(readFileSync(file, "utf8")).body)}`,
  )
  .join(", ");
console.log(
  "Agent adapters, roles, knowledge references, and workspace selection are valid.",
);
console.log(`Role words: ${roleSummary}`);
