import { basename } from "node:path";

import { discoverStudioProjects } from "./lib/discovery";

interface ListOptions {
  scope: "singlepage" | "startup" | null;
  type: "html" | "react" | "next" | null;
  json: boolean;
  help: boolean;
}

function printHelp(): void {
  console.log(
    `
Usage: bun tools/studio/list.ts [options]

Options:
  --scope <singlepage|startup>           Filter by manifest.scope
  --type <html|react|next>               Filter by manifest.type
  --json                                 Output JSON
  --help                                 Show help
`.trim(),
  );
}

function parseArgs(argv: string[]): ListOptions {
  const options: ListOptions = {
    scope: null,
    type: null,
    json: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--scope") {
      options.scope = (argv[index + 1] ?? null) as ListOptions["scope"];
      index += 1;
      continue;
    }

    if (arg.startsWith("--scope=")) {
      options.scope = arg.slice("--scope=".length) as ListOptions["scope"];
      continue;
    }

    if (arg === "--type") {
      options.type = (argv[index + 1] ?? null) as ListOptions["type"];
      index += 1;
      continue;
    }

    if (arg.startsWith("--type=")) {
      options.type = arg.slice("--type=".length) as ListOptions["type"];
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function pad(value: string, width: number): string {
  return value.padEnd(width, " ");
}

function printTable(
  studioProjects: Awaited<
    ReturnType<typeof discoverStudioProjects>
  >["studioProjects"],
): void {
  if (!studioProjects.length) {
    console.log("No Studio projects found for the selected filters.");
    return;
  }

  const rows = studioProjects.map((studioProject) => {
    const slug = basename(studioProject.studioProjectDir);
    const manifest = studioProject.manifest;

    return {
      location: studioProject.relativeDir,
      id: manifest.id ?? "-",
      type: manifest.type ?? "-",
      scope: manifest.scope ?? "-",
      slug,
      title: manifest.title ?? "-",
    };
  });

  const locationWidth = Math.max(
    "location".length,
    ...rows.map((row) => row.location.length),
  );
  const idWidth = Math.max("id".length, ...rows.map((row) => row.id.length));
  const typeWidth = Math.max(
    "type".length,
    ...rows.map((row) => row.type.length),
  );
  const scopeWidth = Math.max(
    "scope".length,
    ...rows.map((row) => row.scope.length),
  );
  const slugWidth = Math.max(
    "slug".length,
    ...rows.map((row) => row.slug.length),
  );

  console.log(
    `${pad("location", locationWidth)}  ${pad("id", idWidth)}  ${pad("type", typeWidth)}  ${pad("scope", scopeWidth)}  ${pad("slug", slugWidth)}  title`,
  );
  console.log(
    `${"-".repeat(locationWidth)}  ${"-".repeat(idWidth)}  ${"-".repeat(typeWidth)}  ${"-".repeat(scopeWidth)}  ${"-".repeat(slugWidth)}  ${"-".repeat(5)}`,
  );

  for (const row of rows) {
    console.log(
      `${pad(row.location, locationWidth)}  ${pad(row.id, idWidth)}  ${pad(row.type, typeWidth)}  ${pad(row.scope, scopeWidth)}  ${pad(row.slug, slugWidth)}  ${row.title}`,
    );
  }

  console.log(`\nTotal: ${rows.length}`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const { studioProjects, invalidStudioProjects } =
    await discoverStudioProjects();

  const filtered = studioProjects.filter((studioProject) => {
    if (options.scope && studioProject.manifest.scope !== options.scope) {
      return false;
    }

    if (options.type && studioProject.manifest.type !== options.type) {
      return false;
    }

    return true;
  });

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          studioProjects: filtered.map((studioProject) => ({
            location: studioProject.relativeDir,
            manifestPath: studioProject.manifestPath,
            manifest: studioProject.manifest,
          })),
          invalidStudioProjects,
        },
        null,
        2,
      ),
    );
    return;
  }

  printTable(filtered);

  if (invalidStudioProjects.length) {
    console.error(
      `\nInvalid manifests skipped: ${invalidStudioProjects.length}`,
    );
    for (const invalidStudioProject of invalidStudioProjects) {
      console.error(
        `- ${invalidStudioProject.manifestPath}: ${invalidStudioProject.error}`,
      );
    }
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
