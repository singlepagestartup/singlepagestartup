#!/usr/bin/env bun
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { isDeepStrictEqual, parseArgs } from "node:util";

interface IObject {
  [key: string]: unknown;
}
interface IJsonNode {
  start: number;
  end: number;
  members?: Map<string, IJsonNode>;
}
interface IOptions {
  repoRoot: string;
  repoName?: string;
  envFile?: string;
  remoteUrl?: string;
  environment: string;
  opencodeVersion?: string;
  outputDir?: string;
  writeClients: boolean;
  checkClients: boolean;
  ifConfigured: boolean;
  writeProject: boolean;
  applyClaude: boolean;
  applyCodex: boolean;
}
interface IWritePlan {
  destination: string;
  original: string;
  generated: string;
}

const REPO_ROOT = resolve(import.meta.dir, "../..");

function isObject(value: unknown): value is IObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function maskJsonComments(text: string) {
  return text.replace(
    /"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g,
    (token) => (token.startsWith('"') ? token : token.replace(/[^\r\n]/g, " ")),
  );
}

function jsonDocument(text: string) {
  // Mask JSONC syntax without shifting the source offsets used for edits.
  const source = maskJsonComments(text).replace(
    /"(?:\\.|[^"\\])*"|,(?=\s*[}\]])/g,
    (token) => (token.startsWith('"') ? token : " "),
  );
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error("Invalid JSON client configuration");
  }
  if (!isObject(value))
    throw new Error("Client configuration must be a JSON object");
  let cursor = 0;
  const skip = () => {
    while (/\s/.test(source[cursor] || "") && cursor < source.length) cursor++;
  };
  const stringEnd = () => {
    cursor++;
    while (source[cursor] !== '"') {
      if (source[cursor] === "\\") cursor++;
      cursor++;
    }
    cursor++;
  };
  const node = (): IJsonNode => {
    skip();
    const start = cursor;
    if (source[cursor] === "{") {
      cursor++;
      skip();
      const members = new Map<string, IJsonNode>();
      while (source[cursor] !== "}") {
        const keyStart = cursor;
        stringEnd();
        const key = JSON.parse(source.slice(keyStart, cursor)) as string;
        if (members.has(key)) throw new Error(`Duplicate JSON key: ${key}`);
        skip();
        cursor++; // colon
        members.set(key, node());
        skip();
        if (source[cursor] === ",") {
          cursor++;
          skip();
        }
      }
      return { start, end: ++cursor, members };
    }
    if (source[cursor] === "[") {
      cursor++;
      skip();
      while (source[cursor] !== "]") {
        node(); // Validate duplicate keys in objects inside arrays too.
        skip();
        if (source[cursor] === ",") {
          cursor++;
          skip();
        }
      }
      cursor++;
    } else if (source[cursor] === '"') {
      stringEnd();
    } else {
      while (cursor < source.length && !/[\s,}\]]/.test(source[cursor]))
        cursor++;
    }
    return { start, end: cursor };
  };
  return { source, value, root: node() };
}

export function parseJson(text: string) {
  return jsonDocument(text).value;
}

export function editJson(text: string, path: string[], value: unknown) {
  const { source, root } = jsonDocument(text);
  let current = root;
  for (let depth = 0; depth < path.length; depth++) {
    if (!current.members)
      throw new Error(
        `Expected an object at ${path.slice(0, depth).join(".")}`,
      );
    const child = current.members.get(path[depth]);
    if (child && depth < path.length - 1) {
      current = child;
      continue;
    }
    const indent = "  ".repeat(depth + 1);
    const encode = (data: unknown) =>
      JSON.stringify(data, null, 2).replace(/\n/g, `\n${indent}`);
    let result: string;
    if (child) {
      if (
        isDeepStrictEqual(
          JSON.parse(source.slice(child.start, child.end)),
          value,
        )
      )
        return text;
      result =
        text.slice(0, child.start) + encode(value) + text.slice(child.end);
    } else {
      let nested = value;
      for (const key of path.slice(depth + 1).reverse())
        nested = { [key]: nested };
      const end = current.end - 1;
      const comma =
        current.members.size &&
        !maskJsonComments(text.slice(current.start, end))
          .trimEnd()
          .endsWith(",")
          ? ","
          : "";
      const insertion = `${comma}\n${indent}${JSON.stringify(path[depth])}: ${encode(nested)}\n${"  ".repeat(depth)}`;
      result = text.slice(0, end) + insertion + text.slice(end);
    }
    parseJson(result);
    return result;
  }
  throw new Error("Client configuration path is empty");
}

function parseToml(text: string): IObject {
  if (typeof Bun.TOML?.parse !== "function")
    throw new Error("MCP configuration generation requires Bun 1.3.6 or newer");
  try {
    return Bun.TOML.parse(text) as IObject;
  } catch {
    throw new Error("Invalid TOML client configuration");
  }
}

export function editCodex(text: string, name: string, url: string) {
  const original = parseToml(text);
  const servers = original.mcp_servers ?? {};
  if (
    !isObject(servers) ||
    (Object.hasOwn(servers, name) && !isObject(servers[name]))
  ) {
    throw new Error("Codex mcp_servers and server entries must be tables");
  }
  const header = `[mcp_servers.${JSON.stringify(name)}]\n`;
  const urlLine = `url = ${JSON.stringify(url)}\n`;
  let result: string;
  if (!Object.hasOwn(servers, name)) {
    result = text.trimEnd() + (text.trim() ? "\n\n" : "") + header + urlLine;
  } else {
    const server = servers[name] as IObject;
    if (Object.hasOwn(server, "command"))
      throw new Error(
        `Codex MCP ${name} already names a local server; rename it first`,
      );
    if (server.url === url) return text;
    const sections = [...text.matchAll(/^[ \t]*(\[[^\r\n]+\])[^\r\n]*\r?$/gm)];
    const matches: { start: number; end: number }[] = [];
    for (let index = 0; index < sections.length; index++) {
      const section = sections[index];
      try {
        const probe = parseToml(`${section[1]}\n__sps_probe__ = true\n`);
        if (
          isDeepStrictEqual(probe, {
            mcp_servers: { [name]: { __sps_probe__: true } },
          })
        ) {
          matches.push({
            start: section.index! + section[0].length,
            end: sections[index + 1]?.index ?? text.length,
          });
        }
      } catch {
        continue;
      }
    }
    if (matches.length !== 1)
      throw new Error(
        `Codex MCP ${name} must use a [mcp_servers.<name>] table`,
      );
    const { start, end } = matches[0];
    let block = text.slice(start, end);
    const line = /^[ \t]*(?:url|"url"|'url')[ \t]*=[^\r\n]*(?:\r?\n|$)/m.exec(
      block,
    );
    block = line
      ? block.slice(0, line.index) +
        urlLine +
        block.slice(line.index + line[0].length)
      : `\n${urlLine}${block}`;
    result = text.slice(0, start) + block + text.slice(end);
  }
  const expected = parseToml(text);
  const expectedServers = (expected.mcp_servers ??= {}) as IObject;
  const expectedServer = (expectedServers[name] ??= {}) as IObject;
  expectedServer.url = url;
  if (!isDeepStrictEqual(parseToml(result), expected))
    throw new Error(
      `Cannot update Codex MCP ${name} without changing other settings`,
    );
  return result;
}

function envTokens(text: string) {
  const tokens: string[] = [];
  let token = "";
  let started = false;
  let quote = "";
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quote === "'") {
      if (character === quote) quote = "";
      else token += character;
    } else if (character === "\\") {
      const next = text[++index];
      if (next === undefined)
        throw new Error("Incomplete escape in deployment variable");
      token += quote && next !== '"' && next !== "\\" ? `\\${next}` : next;
      started = true;
    } else if (quote) {
      if (character === quote) quote = "";
      else token += character;
    } else if (character === "#") {
      break;
    } else if (character === '"' || character === "'") {
      quote = character;
      started = true;
    } else if (/\s/.test(character)) {
      if (started) tokens.push(token);
      token = "";
      started = false;
    } else {
      token += character;
      started = true;
    }
  }
  if (quote) throw new Error("Unclosed quote in deployment variable");
  if (started) tokens.push(token);
  return tokens.join(" ");
}

function envValues(path: string) {
  const result: Record<string, string> = {};
  if (!existsSync(path)) return result;
  const keys = new Set([
    "DOMAIN",
    "GITHUB_REPOSITORY",
    "PROJECT_NAME",
    "MCP_SERVICE_NAME",
    "MCP_SERVICE_SUBDOMAIN",
    "MCP_SERVICE_PUBLIC_URL",
    "MCP_CLIENT_OPENCODE_VERSION",
  ]);
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=(.*)$/.exec(
      line,
    );
    if (!match || !keys.has(match[1])) continue;
    if (Object.hasOwn(result, match[1]))
      throw new Error(`Duplicate deployment variable: ${match[1]}`);
    // Read values as data; never execute or source the deployment file.
    result[match[1]] = envTokens(match[2]);
  }
  return result;
}

function repoName(
  root: string,
  values: Record<string, string>,
  override?: string,
) {
  let name = override;
  if (!name) {
    let repo =
      process.env.TARGET_REPO ||
      values.GITHUB_REPOSITORY ||
      process.env.GITHUB_REPOSITORY;
    if (!repo)
      repo = spawnSync("git", ["config", "--get", "remote.origin.url"], {
        cwd: root,
        encoding: "utf8",
      }).stdout?.trim();
    name = (repo || values.PROJECT_NAME || "")
      .replace(/\/+$/, "")
      .replace(/\.git$/, "")
      .split("/")
      .at(-1);
  }
  if (!name || !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(name))
    throw new Error(
      "Cannot resolve project MCP name; configure origin, GITHUB_REPOSITORY or --repo-name",
    );
  return name;
}

function remoteUrl(args: IOptions, values: Record<string, string>) {
  let url =
    args.remoteUrl ||
    process.env.MCP_SERVICE_PUBLIC_URL ||
    values.MCP_SERVICE_PUBLIC_URL;
  if (!url && values.MCP_SERVICE_NAME && values.DOMAIN)
    url = `https://${values.MCP_SERVICE_SUBDOMAIN || "mcp"}.${values.DOMAIN}/mcp`;
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid production MCP URL");
  }
  if (
    !/^https:\/\/[^/\\]+\//i.test(url) ||
    parsed.protocol !== "https:" ||
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parsed.pathname.replace(/\/+$/, "") !== "/mcp" ||
    /[\s<>${}\\]/.test(url)
  ) {
    throw new Error(
      "Production MCP URL must be an HTTPS endpoint ending in /mcp, without credentials or query parameters",
    );
  }
  return url.replace(/\/+$/, "");
}

function opencodeVersion(
  args: IOptions,
  values: Record<string, string>,
  document: IObject,
) {
  const mcp = document.mcp ?? {};
  if (!isObject(mcp)) throw new Error("OpenCode mcp must be an object");
  const existing = Object.hasOwn(mcp, "servers")
    ? "2"
    : Object.values(mcp).some(
          (value) => isObject(value) && Object.hasOwn(value, "type"),
        )
      ? "1"
      : undefined;
  const requested =
    args.opencodeVersion || values.MCP_CLIENT_OPENCODE_VERSION || "auto";
  if (!["auto", "1", "2"].includes(requested))
    throw new Error("MCP_CLIENT_OPENCODE_VERSION must be auto, 1 or 2");
  if (requested !== "auto") {
    if (existing && requested !== existing)
      throw new Error(
        `OpenCode config uses V${existing}; migrate it before selecting V${requested}`,
      );
    return requested;
  }
  if (existing) return existing;
  const processResult = spawnSync("opencode", ["--version"], {
    encoding: "utf8",
    timeout: 5000,
  });
  const version = /^([12])\.\d+\.\d+/m.exec(processResult.stdout || "");
  return processResult.status === 0 && version ? version[1] : "2";
}

function configFiles(
  root: string,
  name: string,
  url: string,
  args: IOptions,
  values: Record<string, string>,
) {
  const plans: IWritePlan[] = [];
  const textAt = (destination: string, fallback = "{}\n") =>
    existsSync(destination) ? readFileSync(destination, "utf8") : fallback;
  const jsonConfig = (file: string, path: string[], entry: IObject) => {
    const destination = join(root, file);
    const original = textAt(destination);
    plans.push({
      destination,
      original,
      generated: editJson(original, path, entry),
    });
  };
  jsonConfig(".mcp.json", ["mcpServers", name], { type: "http", url });
  jsonConfig(".cursor/mcp.json", ["mcpServers", name], { url });
  jsonConfig(".vscode/mcp.json", ["servers", name], { type: "http", url });
  const candidates = [
    "opencode.json",
    "opencode.jsonc",
    ".opencode/opencode.json",
    ".opencode/opencode.jsonc",
  ].map((file) => join(root, file));
  const existing = candidates.filter(existsSync);
  if (existing.length > 1)
    throw new Error(
      "Multiple OpenCode configs found; keep one project config before generating MCP settings",
    );
  let destination = existing[0] || join(root, "opencode.json");
  const original = textAt(destination);
  const document = parseJson(original);
  let sourceDocument = document;
  if (!existing.length && root !== args.repoRoot) {
    const sourceConfigs = candidates
      .map((file) => join(args.repoRoot, relative(root, file)))
      .filter(existsSync);
    if (sourceConfigs.length > 1)
      throw new Error("Multiple OpenCode configs found in the source project");
    if (sourceConfigs.length) {
      sourceDocument = parseJson(readFileSync(sourceConfigs[0], "utf8"));
      destination = join(root, relative(args.repoRoot, sourceConfigs[0]));
    }
  }
  const version = opencodeVersion(args, values, sourceDocument);
  if (Object.hasOwn(document, name))
    throw new Error(
      `${name} is outside OpenCode mcp; move it inside mcp before generating`,
    );
  const entry: IObject = {
    type: "remote",
    url,
    oauth: { scope: "mcp:content" },
  };
  if (version === "1") entry.enabled = true;
  const withSchema = editJson(
    original,
    ["$schema"],
    "https://opencode.ai/config.json",
  );
  const serverPath = version === "2" ? ["mcp", "servers", name] : ["mcp", name];
  plans.push({
    destination,
    original,
    generated: editJson(withSchema, serverPath, entry),
  });
  destination = join(root, ".codex/config.toml");
  const codex = textAt(destination, "");
  plans.push({
    destination,
    original: codex,
    generated: editCodex(codex, name, url),
  });
  return { plans, version };
}

function writePlans(plans: IWritePlan[]) {
  // Validate all formats first, then replace each file atomically.
  for (const { destination, original, generated } of plans) {
    if (original === generated && existsSync(destination)) continue;
    mkdirSync(dirname(destination), { recursive: true });
    const mode = existsSync(destination)
      ? statSync(destination).mode & 0o777
      : 0o644;
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
      writeFileSync(temporary, generated, { mode, flag: "wx" });
      chmodSync(temporary, mode);
      renameSync(temporary, destination);
    } finally {
      rmSync(temporary, { force: true });
    }
    console.log(`Updated ${destination}`);
  }
}

function shellQuote(value: string) {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(value)
    ? value
    : `'${value.replace(/'/g, `'"'"'`)}'`;
}

function printCommands(
  name: string,
  url: string | undefined,
  environment: string,
) {
  const localName = shellQuote(`${name}-local`);
  const remoteName = shellQuote(`${name}-${environment}`);
  const endpoint = shellQuote(url || "https://mcp.<domain>/mcp");
  console.log(`Claude Code: /mcp -> ${remoteName} -> Authenticate`);
  console.log(`OpenCode: opencode mcp auth ${remoteName}`);
  console.log(`Codex: codex mcp login ${remoteName} --scopes mcp:content`);
  console.log(
    "Cursor / VS Code: open MCP settings and authenticate the project server",
  );
  console.log(
    `ChatGPT / Claude web connectors: ${url || "https://mcp.<domain>/mcp"} (configure in the client UI)`,
  );
  console.log("Manual registration (clients without project configuration):");
  console.log(`  claude mcp add --transport http ${remoteName} ${endpoint}`);
  console.log(`  codex mcp add ${remoteName} --url ${endpoint}`);
  console.log(
    `  claude mcp add --transport http ${localName} http://127.0.0.1:3001/mcp`,
  );
  console.log(`  codex mcp add ${localName} --url http://127.0.0.1:3001/mcp`);
}

export function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({
    args: argv,
    options: {
      "repo-root": { type: "string" },
      "repo-name": { type: "string" },
      "env-file": { type: "string" },
      "remote-url": { type: "string" },
      environment: { type: "string" },
      "opencode-version": { type: "string" },
      "output-dir": { type: "string" },
      "write-clients": { type: "boolean" },
      "check-clients": { type: "boolean" },
      "if-configured": { type: "boolean" },
      "write-project": { type: "boolean" },
      "apply-claude": { type: "boolean" },
      "apply-codex": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(`Generate project-scoped MCP client configuration without storing credentials.
Usage: tools/mcp/setup-project-mcp.sh [options]
  --repo-root <path>          Project checkout (defaults to this repository)
  --repo-name <name>          Override the repository name
  --env-file <path>           Deployment configuration (defaults to tools/deployer/.env)
  --remote-url <url>          Production HTTPS endpoint ending in /mcp
  --environment <name>        Connector suffix (defaults to production)
  --opencode-version <auto|1|2>
  --output-dir <path>         Export public client entries into another directory
  --write-clients             Merge the remote server into all five client configs
  --check-clients             Validate generation without writing files
  --if-configured             Skip when no remote MCP endpoint is configured
  --write-project            Merge the legacy local stdio server into .mcp.json
  --apply-claude              Register local and remote Claude CLI connections
  --apply-codex               Register and authenticate local and remote Codex connections
  -h, --help                 Show this help`);
    return;
  }
  const args: IOptions = {
    repoRoot: resolve(values["repo-root"] || REPO_ROOT),
    repoName: values["repo-name"],
    envFile: values["env-file"],
    remoteUrl: values["remote-url"],
    environment:
      values.environment || process.env.ENVIRONMENT_TYPE || "production",
    opencodeVersion: values["opencode-version"],
    outputDir: values["output-dir"],
    writeClients: Boolean(values["write-clients"]),
    checkClients: Boolean(values["check-clients"]),
    ifConfigured: Boolean(values["if-configured"]),
    writeProject: Boolean(values["write-project"]),
    applyClaude: Boolean(values["apply-claude"]),
    applyCodex: Boolean(values["apply-codex"]),
  };
  const root = args.repoRoot;
  const valuesFromEnv = envValues(
    args.envFile || join(root, "tools/deployer/.env"),
  );
  const url = remoteUrl(args, valuesFromEnv);
  if (args.ifConfigured && !url) {
    console.log(
      "Skipping remote MCP client configs: configure MCP_SERVICE_NAME and DOMAIN, or MCP_SERVICE_PUBLIC_URL",
    );
    return;
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(args.environment))
    throw new Error("Invalid MCP environment name");
  const name = repoName(root, valuesFromEnv, args.repoName);
  if (
    (args.writeClients ||
      args.checkClients ||
      args.applyClaude ||
      args.applyCodex) &&
    !url
  )
    throw new Error(
      "Configure MCP_SERVICE_NAME and DOMAIN in tools/deployer/.env, or pass --remote-url",
    );
  if (args.writeProject && (args.writeClients || args.checkClients))
    throw new Error("Use --write-project and --write-clients separately");
  const output = args.outputDir || process.env.MCP_CLIENT_CONFIG_OUTPUT_DIR;
  const destinationRoot = output ? resolve(output) : root;
  if (args.writeClients || args.checkClients) {
    const { plans, version } = configFiles(
      destinationRoot,
      `${name}-${args.environment}`,
      url!,
      args,
      valuesFromEnv,
    );
    if (args.writeClients) writePlans(plans);
    else {
      console.log("MCP client configuration preflight: OK");
      return;
    }
    console.log(
      `OpenCode format: V${version}; MCP: ${name}-${args.environment} -> ${url}`,
    );
  } else if (args.writeProject) {
    const destination = join(destinationRoot, ".mcp.json");
    const original = existsSync(destination)
      ? readFileSync(destination, "utf8")
      : "{}\n";
    writePlans([
      {
        destination,
        original,
        generated: editJson(original, ["mcpServers", name], {
          command: "bun",
          args: ["./apps/mcp/index.ts"],
          cwd: "./",
        }),
      },
    ]);
  }
  for (const [client, apply] of [
    ["claude", args.applyClaude],
    ["codex", args.applyCodex],
  ] as const) {
    if (!apply) continue;
    for (const [server, endpoint] of [
      [`${name}-local`, "http://127.0.0.1:3001/mcp"],
      [`${name}-${args.environment}`, url!],
    ]) {
      const command =
        client === "claude"
          ? ["mcp", "add", "--transport", "http", server, endpoint]
          : ["mcp", "add", server, "--url", endpoint];
      const commands =
        client === "codex"
          ? [command, ["mcp", "login", server, "--scopes", "mcp:content"]]
          : [command];
      for (const commandArgs of commands) {
        const result = spawnSync(client, commandArgs, {
          cwd: root,
          stdio: "inherit",
        });
        if (result.error) throw result.error;
        if (result.status !== 0)
          throw new Error(
            `${client} MCP command failed with exit code ${result.status}`,
          );
      }
    }
  }
  printCommands(name, url, args.environment);
}

if (import.meta.main) {
  try {
    main();
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
