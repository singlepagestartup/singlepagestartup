import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const ModuleNameSchema = z.enum([
  "agent",
  "analytic",
  "billing",
  "blog",
  "broadcast",
  "crm",
  "ecommerce",
  "file-storage",
  "host",
  "notification",
  "rbac",
  "social",
  "startup",
  "website-builder",
]);

const ModuleDocInputSchema = z.object({
  module: ModuleNameSchema,
});

const DocEntityTypeSchema = z.enum(["model", "relation"]);

const EntityDocInputSchema = z.object({
  module: ModuleNameSchema,
  type: DocEntityTypeSchema,
  name: z.string().min(1),
});

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findRepoRoot(startDir: string): Promise<string | null> {
  let current = startDir;
  while (true) {
    const pkg = path.join(current, "package.json");
    const nx = path.join(current, "nx.json");
    if ((await pathExists(pkg)) && (await pathExists(nx))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

async function resolveRepoPath(relativePath: string): Promise<string> {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot =
    (await findRepoRoot(process.cwd())) ?? (await findRepoRoot(moduleDir));

  const baseDirs = [
    repoRoot,
    process.cwd(),
    path.resolve(process.cwd(), "..", ".."),
    moduleDir,
    path.resolve(moduleDir, ".."),
    path.resolve(moduleDir, "..", ".."),
  ].filter((value): value is string => Boolean(value));

  for (const baseDir of baseDirs) {
    const candidate = path.resolve(baseDir, relativePath);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  const fallbackBase = repoRoot ?? moduleDir;
  return path.resolve(fallbackBase, relativePath);
}

export function registerTools(mcp: McpServer) {
  mcp.registerTool(
    "get-module-doc",
    {
      title: "Get Module Documentation",
      description:
        "Return README.md content for a module (kebab-case names). Works when the MCP server runs from the repo root or can resolve libs/modules/. Available: agent, analytic, billing, blog, broadcast, crm, ecommerce, file-storage, host, notification, rbac, social, startup, website-builder.",
      inputSchema: {
        module: ModuleNameSchema,
      },
    },
    async (args) => {
      const parsed = ModuleDocInputSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid input: ${parsed.error.message}`,
            },
          ],
        };
      }

      const relativePath = `libs/modules/${parsed.data.module}/README.md`;
      const filePath = await resolveRepoPath(relativePath);

      try {
        const content = await fs.readFile(filePath, "utf8");
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Doc not found: ${relativePath}`,
            },
          ],
        };
      }
    },
  );

  mcp.registerTool(
    "get-project-doc",
    {
      title: "Get Project Documentation",
      description:
        "Return the root README.md for the project. Start with this file to understand the global architecture and where to find module-specific docs. After reading it, use get-module-doc with a module name to fetch detailed documentation for that module.",
      inputSchema: {},
    },
    async () => {
      const relativePath = "README.md";
      const filePath = await resolveRepoPath(relativePath);

      try {
        const content = await fs.readFile(filePath, "utf8");
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text",
              text: "Doc not found: README.md",
            },
          ],
        };
      }
    },
  );

  mcp.registerTool(
    "get-entity-doc",
    {
      title: "Get Model/Relation Documentation",
      description:
        "Return README.md content for a module model or relation. Provide module, type (model|relation), and name in kebab-case (e.g. models: widget, buttons-array; relations: widgets-to-sliders).",
      inputSchema: {
        module: ModuleNameSchema,
        type: DocEntityTypeSchema,
        name: z.string(),
      },
    },
    async (args) => {
      const parsed = EntityDocInputSchema.safeParse(args);
      if (!parsed.success) {
        return {
          content: [
            {
              type: "text",
              text: `Invalid input: ${parsed.error.message}`,
            },
          ],
        };
      }

      const folder = parsed.data.type === "model" ? "models" : "relations";
      const relativePath = `libs/modules/${parsed.data.module}/${folder}/${parsed.data.name}/README.md`;
      const filePath = await resolveRepoPath(relativePath);

      try {
        const content = await fs.readFile(filePath, "utf8");
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text",
              text: `Doc not found: ${relativePath}`,
            },
          ],
        };
      }
    },
  );
}
