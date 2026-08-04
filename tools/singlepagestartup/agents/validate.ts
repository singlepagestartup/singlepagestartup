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
const requiredPreDevelopment = [
  "account-manager",
  "business-analyst",
  "market-researcher",
  "strategist",
  "communication-strategist",
  "brand-designer",
  "web-designer",
];

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

  for (const id of requiredPreDevelopment) {
    const expectedRole = `.agents/roles/${id}.md`;
    const providerAdapters = [
      path.join(repositoryRoot, `.codex/agents/${id}.toml`),
      path.join(repositoryRoot, `.claude/agents/${id}.md`),
    ];

    for (const adapter of providerAdapters) {
      if (!existsSync(adapter)) {
        report(adapter, "pre-development-adapter", `missing adapter for ${id}`);
        continue;
      }
      const source = readFileSync(adapter, "utf8");
      if (canonicalPointer(source) !== expectedRole) {
        report(
          adapter,
          "pre-development-role-loader",
          `expected Canonical role: \`${expectedRole}\``,
        );
      }
      if (/Canonical playbook:/.test(source)) {
        report(
          adapter,
          "duplicate-profession-loader",
          "adapter must load the consolidated role only",
        );
      }
      if (
        !/Read the canonical role completely before acting; it contains both professional\s+responsibility and method\./.test(
          source,
        )
      ) {
        report(
          adapter,
          "pre-development-runtime-load",
          "adapter must explicitly load the consolidated role before acting",
        );
      }
    }

    const codexAdapter = path.join(repositoryRoot, `.codex/agents/${id}.toml`);
    if (existsSync(codexAdapter)) {
      const source = readFileSync(codexAdapter, "utf8");
      for (const requiredField of [
        "name",
        "description",
        "developer_instructions",
      ]) {
        if (!new RegExp(`^${requiredField}\\s*=`, "m").test(source)) {
          report(
            codexAdapter,
            "codex-custom-agent-field",
            `missing required ${requiredField}`,
          );
        }
      }
    }
  }
}

function validateRoles() {
  const rolesRoot = path.join(repositoryRoot, ".agents/roles");
  const documentationFiles = new Set(["README.md", "SOURCES.md"]);
  const roleFiles = filesBelow(rolesRoot, ".md").filter(
    (file) => !documentationFiles.has(path.basename(file)),
  );
  const directFiles = readdirSync(rolesRoot).filter((name) => {
    return (
      statSync(path.join(rolesRoot, name)).isFile() &&
      name.endsWith(".md") &&
      !documentationFiles.has(name)
    );
  }).length;
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
    ...filesBelow(path.join(repositoryRoot, ".agents/templates"), ".md"),
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
    if (parsed.fields.has("knowledge")) {
      report(
        file,
        "duplicate-profession-knowledge",
        "professional method must be consolidated in the role body",
      );
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

  for (const id of requiredPreDevelopment) {
    if (!ids.has(id)) report(rolesRoot, "required-role", `missing ${id}.md`);
    const rolePath = path.join(rolesRoot, `${id}.md`);
    if (
      existsSync(rolePath) &&
      !readFileSync(rolePath, "utf8").includes("## Required method")
    ) {
      report(
        rolePath,
        "consolidated-professional-method",
        "missing Required method section",
      );
    }
  }

  const deprecatedProfessionRoot = path.join(
    repositoryRoot,
    ".agents/knowledge/professions",
  );
  if (existsSync(deprecatedProfessionRoot)) {
    report(
      deprecatedProfessionRoot,
      "duplicate-profession-directory",
      "professional methods belong in .agents/roles/*.md",
    );
  }
}

function parseActiveLayer(source: string) {
  return source.match(/^active_layer:\s*(auto|singlepage|startup)\s*$/m)?.[1];
}

function resolveLayer(
  repository: string,
  configSource: string,
  localConfig?: string,
) {
  const override = localConfig ? parseActiveLayer(localConfig) : "auto";
  if (override === "singlepage" || override === "startup") return override;
  const parsed = parse(configSource) as {
    default_layer?: string;
    repository_layers?: Record<string, string>;
  };
  return (
    parsed.repository_layers?.[repository] ?? parsed.default_layer ?? "startup"
  );
}

function validateWorkspaceSelection() {
  const configFile = path.join(
    repositoryRoot,
    "apps/studio/workspace/config.yaml",
  );
  const ignoreFile = path.join(repositoryRoot, ".gitignore");
  const config = readFileSync(configFile, "utf8");
  const parsed = parse(config) as {
    default_layer?: string;
    repository_layers?: Record<string, string>;
  };
  if (parsed.default_layer !== "startup") {
    report(
      configFile,
      "workspace-config",
      "workspace config must default to startup",
    );
  }
  if (
    resolveLayer("singlepagestartup/singlepagestartup", config) !== "singlepage"
  ) {
    report(
      configFile,
      "canonical-layer",
      "canonical repository mapping must resolve singlepage",
    );
  }
  if (resolveLayer("example/downstream", config) !== "startup") {
    report(
      configFile,
      "downstream-layer",
      "unknown repositories must use the startup default",
    );
  }
  if (
    resolveLayer("example/downstream", config, "active_layer: singlepage\n") !==
    "singlepage"
  ) {
    report(
      configFile,
      "local-override",
      "local override must win over repository identity",
    );
  }
  if (
    !readFileSync(ignoreFile, "utf8").includes(
      "apps/studio/workspace/config.local.yaml",
    )
  ) {
    report(
      ignoreFile,
      "local-override-ignore",
      "apps/studio/workspace/config.local.yaml must be gitignored",
    );
  }
}

function validatePreDevelopmentState() {
  const workflowFile = path.join(
    repositoryRoot,
    ".agents/workflows/pre-development.md",
  );
  const obsoleteWorkflowDirectory = path.join(
    repositoryRoot,
    ".agents/workflows/client",
  );
  const stageArtifacts = new Map<string, Set<string>>([
    [
      "00-understand",
      new Set([
        "brief",
        "decision-profile",
        "evidence",
        "business",
        "research",
      ]),
    ],
    ["10-decide", new Set(["strategy"])],
    ["20-package", new Set(["brand", "assets"])],
    ["30-design", new Set(["website"])],
  ]);
  const statuses = new Set([
    "not_started",
    "in_progress",
    "blocked",
    "complete",
  ]);
  const allowedKeys = new Set([
    "schema",
    "active_stage",
    "status",
    "active_artifacts",
    "blockers",
  ]);

  if (!existsSync(workflowFile)) {
    report(workflowFile, "pre-development-workflow", "missing workflow");
  } else {
    const workflow = readFileSync(workflowFile, "utf8");
    for (const [stage, heading] of [
      ["00-understand", "## 00 — Understand"],
      ["10-decide", "## 10 — Decide"],
      ["20-package", "## 20 — Package"],
      ["30-design", "## 30 — Design"],
    ]) {
      if (!workflow.includes(heading)) {
        report(
          workflowFile,
          "numbered-pre-development-stage",
          `missing ${stage} heading`,
        );
      }
    }
    if (!workflow.includes("pre-development.yaml")) {
      report(
        workflowFile,
        "durable-pre-development-cursor",
        "workflow must define its layer-local state file",
      );
    }
  }

  if (existsSync(obsoleteWorkflowDirectory)) {
    report(
      obsoleteWorkflowDirectory,
      "obsolete-workflow-directory",
      "pre-development workflow belongs directly in .agents/workflows",
    );
  }

  for (const layer of ["singlepage", "startup"]) {
    const stateFile = path.join(
      repositoryRoot,
      `apps/studio/workspace/pre-development/${layer}.yaml`,
    );
    if (!existsSync(stateFile)) {
      report(stateFile, "pre-development-state", `missing ${layer} cursor`);
      continue;
    }

    let state: Record<string, unknown>;
    try {
      const parsed = parse(readFileSync(stateFile, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        report(stateFile, "pre-development-state", "expected a YAML object");
        continue;
      }
      state = parsed as Record<string, unknown>;
    } catch (error) {
      report(
        stateFile,
        "pre-development-state-yaml",
        error instanceof Error ? error.message : String(error),
      );
      continue;
    }

    for (const key of Object.keys(state)) {
      if (!allowedKeys.has(key)) {
        report(stateFile, "pre-development-state-key", `unexpected key ${key}`);
      }
    }

    if (state.schema !== "singlepagestartup.pre-development-state.v1") {
      report(
        stateFile,
        "pre-development-state-schema",
        "expected singlepagestartup.pre-development-state.v1",
      );
    }

    const stage =
      typeof state.active_stage === "string" ? state.active_stage : "";
    const status = typeof state.status === "string" ? state.status : "";
    const artifacts = Array.isArray(state.active_artifacts)
      ? state.active_artifacts
      : [];
    const blockers = Array.isArray(state.blockers) ? state.blockers : [];

    if (!stageArtifacts.has(stage)) {
      report(stateFile, "pre-development-stage", `invalid ${stage || "value"}`);
    }
    if (!statuses.has(status)) {
      report(
        stateFile,
        "pre-development-status",
        `invalid ${status || "value"}`,
      );
    }
    if (!Array.isArray(state.active_artifacts)) {
      report(
        stateFile,
        "pre-development-active-artifacts",
        "expected a string array",
      );
    } else if (artifacts.some((value) => typeof value !== "string")) {
      report(
        stateFile,
        "pre-development-active-artifacts",
        "all entries must be strings",
      );
    }
    if (!Array.isArray(state.blockers)) {
      report(stateFile, "pre-development-blockers", "expected a string array");
    } else if (blockers.some((value) => typeof value !== "string")) {
      report(
        stateFile,
        "pre-development-blockers",
        "all entries must be strings",
      );
    }

    const allowedArtifacts = stageArtifacts.get(stage);
    if (
      allowedArtifacts &&
      artifacts.some(
        (artifact) =>
          typeof artifact === "string" && !allowedArtifacts.has(artifact),
      )
    ) {
      report(
        stateFile,
        "pre-development-stage-artifacts",
        `${stage} names an artifact outside its stage`,
      );
    }
    if (status !== "complete" && artifacts.length === 0) {
      report(
        stateFile,
        "pre-development-active-artifacts",
        "non-complete state must name current work",
      );
    }
    if (status === "not_started" && stage !== "00-understand") {
      report(
        stateFile,
        "pre-development-not-started",
        "not_started is valid only for 00-understand",
      );
    }
    if (status === "blocked" && blockers.length === 0) {
      report(
        stateFile,
        "pre-development-blocked",
        "blocked state must name at least one artifact section",
      );
    }
    if (status !== "blocked" && blockers.length > 0) {
      report(
        stateFile,
        "pre-development-blockers",
        "only blocked state may retain blockers",
      );
    }
    if (
      status === "complete" &&
      (stage !== "30-design" || artifacts.length > 0 || blockers.length > 0)
    ) {
      report(
        stateFile,
        "pre-development-complete",
        "complete requires 30-design with empty active_artifacts and blockers",
      );
    }
  }
}

function validateDecisionProfileSystem() {
  const workflowFile = path.join(
    repositoryRoot,
    ".agents/workflows/pre-development.md",
  );
  const templateFile = path.join(
    repositoryRoot,
    ".agents/templates/decision-profile.md",
  );
  const loaderFile = path.join(
    repositoryRoot,
    "tools/studio/workspace/loader.ts",
  );

  if (!existsSync(templateFile)) {
    report(
      templateFile,
      "decision-profile-template",
      "missing project-specific routing template",
    );
  } else {
    const template = readFileSync(templateFile, "utf8");
    for (const required of [
      "## Business-model classification",
      "## Selected methods and benchmarks",
      "## Material decision requirements",
      "## Stage gate",
      "not-applicable",
    ]) {
      if (!template.includes(required)) {
        report(
          templateFile,
          "decision-profile-template",
          `missing ${required}`,
        );
      }
    }
  }

  if (existsSync(workflowFile)) {
    const workflow = readFileSync(workflowFile, "utf8");
    for (const required of [
      "## Domain adaptation and quality gate",
      "knowledge/decision-profile/<layer>.md",
      "Structural completeness",
      "never passes the gate.",
    ]) {
      if (!workflow.includes(required)) {
        report(
          workflowFile,
          "decision-profile-workflow",
          `missing ${required}`,
        );
      }
    }
  }

  if (existsSync(loaderFile)) {
    const loader = readFileSync(loaderFile, "utf8");
    const layeredKinds = loader.match(
      /const LAYERED_ENTRY_KINDS = \[([\s\S]*?)\] as const/,
    )?.[1];
    if (!layeredKinds?.includes('"decision-profile"')) {
      report(
        loaderFile,
        "decision-profile-inheritance",
        "decision profiles must resolve through the singlepage-to-startup overlay",
      );
    }
  }

  for (const id of requiredPreDevelopment) {
    const roleFile = path.join(repositoryRoot, `.agents/roles/${id}.md`);
    if (
      existsSync(roleFile) &&
      !/decision[- ]profile/i.test(readFileSync(roleFile, "utf8"))
    ) {
      report(
        roleFile,
        "decision-profile-role-gate",
        "pre-development roles must consume or propose the active decision profile",
      );
    }
  }

  for (const artifact of [
    "brief",
    "business",
    "research",
    "strategy",
    "brand",
    "website",
  ]) {
    const artifactTemplate = path.join(
      repositoryRoot,
      `.agents/templates/${artifact}.md`,
    );
    if (
      existsSync(artifactTemplate) &&
      !/decision[- ]profile/i.test(readFileSync(artifactTemplate, "utf8"))
    ) {
      report(
        artifactTemplate,
        "decision-profile-artifact-gate",
        `${artifact} template must route material domain requirements`,
      );
    }
  }

  for (const layer of ["singlepage", "startup"] as const) {
    const indexFile = path.join(
      repositoryRoot,
      `apps/studio/workspace/index/${layer}.yaml`,
    );
    const profileFile = path.join(
      repositoryRoot,
      `apps/studio/workspace/knowledge/decision-profile/${layer}.md`,
    );
    if (!existsSync(profileFile)) {
      report(
        profileFile,
        "decision-profile-source",
        `missing ${layer} project profile`,
      );
    }
    if (!existsSync(indexFile)) continue;

    const parsed = parse(readFileSync(indexFile, "utf8"));
    const index =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    const entries = Array.isArray(index.entries)
      ? index.entries.filter((entry): entry is Record<string, unknown> =>
          Boolean(entry && typeof entry === "object" && !Array.isArray(entry)),
        )
      : [];
    const byId = new Map(
      entries
        .filter((entry) => typeof entry.id === "string")
        .map((entry) => [entry.id as string, entry]),
    );
    const profileId = `${layer}.decision-profile`;
    const profile = byId.get(profileId);
    if (
      profile?.kind !== "decision-profile" ||
      profile.path !== `knowledge/decision-profile/${layer}.md`
    ) {
      report(
        indexFile,
        "decision-profile-entry",
        `expected ${profileId} at knowledge/decision-profile/${layer}.md`,
      );
    }
    if (
      layer === "startup" &&
      (profile?.extends !== "singlepage.decision-profile" ||
        profile.strategy !== "replace")
    ) {
      report(
        indexFile,
        "decision-profile-resolution",
        "startup decision profile must replace singlepage once populated",
      );
    }

    const profileUses = new Set(
      Array.isArray(profile?.uses)
        ? profile.uses.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    );
    for (const dependency of [`${layer}.brief`, `${layer}.evidence`]) {
      if (!profileUses.has(dependency)) {
        report(
          indexFile,
          "decision-profile-dependency",
          `${profileId} must use ${dependency}`,
        );
      }
    }

    for (const owner of ["business", "research"]) {
      const ownerEntry = byId.get(`${layer}.${owner}`);
      const uses = new Set(
        Array.isArray(ownerEntry?.uses)
          ? ownerEntry.uses.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
      );
      if (!uses.has(profileId)) {
        report(
          indexFile,
          "decision-profile-owner",
          `${layer}.${owner} must use ${profileId}`,
        );
      }
    }

    const sharedList = layer === "singlepage" ? index.exports : index.imports;
    if (
      !Array.isArray(sharedList) ||
      !sharedList.includes("template.decision-profile")
    ) {
      report(
        indexFile,
        "decision-profile-template-binding",
        `${layer} must ${layer === "singlepage" ? "export" : "import"} template.decision-profile`,
      );
    }
  }
}

validateAdapters();
validateRoles();
validateWorkspaceSelection();
validatePreDevelopmentState();
validateDecisionProfileSystem();

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
  .filter((file) => !["README.md", "SOURCES.md"].includes(path.basename(file)))
  .map(
    (file) =>
      `${relative(file)}=${wordCount(parseFrontmatter(readFileSync(file, "utf8")).body)}`,
  )
  .join(", ");
console.log(
  "Agent adapters, consolidated roles, workspace selection, pre-development state, and domain decision profiles are valid.",
);
console.log(`Role words: ${roleSummary}`);
