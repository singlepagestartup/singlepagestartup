/**
 * BDD Suite: project-owned MCP client connections.
 * Given: a checkout, deployment settings and optional existing client settings.
 * When: connections are explicitly generated or deployment exports a bundle.
 * Then: connections use the checkout's repository and remain outside tracked files.
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { editCodex, parseJson } from "./client-configs";

interface IRunOptions {
  generate?: boolean;
  success?: boolean;
}
const SOURCE_ROOT = resolve(import.meta.dir, "../..");
const GENERATOR = join(SOURCE_ROOT, "tools/mcp/client-configs.ts");

class Fixture {
  root = mkdtempSync(join(tmpdir(), "sps-mcp-clients-"));
  environment = { ...process.env };

  constructor() {
    for (const key of [
      "TARGET_REPO",
      "GITHUB_REPOSITORY",
      "MCP_SERVICE_PUBLIC_URL",
      "ENVIRONMENT_TYPE",
      "MCP_CLIENT_CONFIG_OUTPUT_DIR",
    ])
      delete this.environment[key];
  }
  write(relative: string, text: string, mode = 0o644) {
    const path = join(this.root, relative);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    chmodSync(path, mode);
    return path;
  }
  envFile(extra = "") {
    return this.write(
      "tools/deployer/.env",
      "GITHUB_REPOSITORY=owner/m2commerce\nMCP_SERVICE_NAME=mcp\nDOMAIN=m2commerce.ru\n" +
        extra,
    );
  }
  run(command: string[], cwd = this.root, success = true) {
    const processResult = Bun.spawnSync(command, {
      cwd,
      env: this.environment,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      timeout: 15000,
    });
    const result = {
      status: processResult.exitCode,
      stdout: processResult.stdout.toString(),
      stderr: processResult.stderr.toString(),
    };
    expect(result.status, result.stderr).not.toBeNull();
    if (success) expect(result.status, result.stderr).toBe(0);
    else expect(result.status).not.toBe(0);
    return result;
  }
  generate(
    args: string[] = [],
    { success = true, generate = true }: IRunOptions = {},
  ) {
    // Exercise explicit per-client activation; the CLI's no-client mode is
    // separately tested as an isolated export, not a multi-client activation.
    const explicit =
      args.includes("--client") || args.includes("--output-dir") || !generate;
    const targets = explicit
      ? [undefined]
      : success
        ? ["claude", "codex", "cursor", "vscode", "opencode", "kimi", "mimo"]
        : ["opencode"];
    let stdout = "";
    let result!: ReturnType<Fixture["run"]>;
    for (const client of targets) {
      result = this.run(
        [
          process.execPath,
          "--no-env-file",
          GENERATOR,
          "--repo-root",
          this.root,
          ...(generate ? ["--write-clients"] : []),
          ...(client ? ["--client", client] : []),
          ...args,
        ],
        this.root,
        success,
      );
      stdout += result.stdout;
    }
    return { ...result, stdout };
  }

  read(relative: string) {
    return readFileSync(join(this.root, relative), "utf8");
  }
  json(relative: string) {
    return parseJson(this.read(relative)) as any;
  }
  toml(relative = ".codex/config.toml") {
    return Bun.TOML.parse(this.read(relative)) as any;
  }
  snapshot() {
    const files: Record<string, string> = {};
    const visit = (relative: string) => {
      for (const entry of readdirSync(join(this.root, relative), {
        withFileTypes: true,
      })) {
        const child = join(relative, entry.name);
        if (entry.isDirectory()) visit(child);
        else if (entry.isFile())
          files[child] = readFileSync(join(this.root, child)).toString(
            "base64",
          );
      }
    };
    visit("");
    return files;
  }
  installHooks() {
    for (const relative of [
      "create_env.sh",
      "up.sh",
      "tools/mcp/setup-project-mcp.sh",
      "tools/mcp/client-configs.ts",
      "tools/deployer/mcp.sh",
      "tools/deployer/get_env.sh",
      "tools/deployer/get_environment_type.sh",
    ]) {
      const destination = join(this.root, relative);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(SOURCE_ROOT, relative), destination);
      chmodSync(
        destination,
        statSync(join(SOURCE_ROOT, relative)).mode & 0o777,
      );
    }
    for (const relative of [
      "tools/deployer/create_inventory.sh",
      "tools/deployer/domain.sh",
      "tools/deployer/pull_docker_image.sh",
    ])
      this.write(relative, "#!/bin/bash\nexit 0\n", 0o755);
    this.write(
      "bin/ansible-playbook",
      '#!/bin/bash\nif [ "$MOCK_DEPLOY_FAIL" = "$1" ]; then exit 7; fi\nexit 0\n',
      0o755,
    );
    this.environment.PATH =
      join(this.root, "bin") + ":" + this.environment.PATH;
  }
  deploy(action = "up", environment = "", success = true) {
    return this.run(
      ["bash", "./mcp.sh", action, environment],
      join(this.root, "tools/deployer"),
      success,
    );
  }
}

describe("MCP client configuration generation on Bun", () => {
  let fixture: Fixture;
  beforeEach(() => {
    fixture = new Fixture();
  });
  afterEach(() => {
    rmSync(fixture.root, { recursive: true, force: true });
  });

  test("uses the checkout origin instead of an inherited deployment repository", () => {
    fixture.envFile();
    fixture.run(["git", "init"]);
    fixture.run([
      "git",
      "remote",
      "add",
      "origin",
      "git@github.com:customer/client-shop.git",
    ]);
    fixture.environment.TARGET_REPO = "framework/inherited-name";
    fixture.generate(["--remote-url", "https://mcp.client-shop.example/mcp"]);

    expect(fixture.json(".mcp.json").mcpServers).toEqual({
      "client-shop-production": {
        type: "http",
        url: "https://mcp.client-shop.example/mcp",
      },
    });
    expect(fixture.toml().mcp_servers).toHaveProperty("client-shop-production");

    fixture.generate(["--repo-name", "explicit-project"]);
    expect(fixture.toml().mcp_servers).toHaveProperty(
      "explicit-project-production",
    );
  });

  test("exports isolated samples by default instead of activating conflicting project files", () => {
    fixture.envFile();
    fixture.generate(["--write-clients"], { generate: false });

    expect(existsSync(join(fixture.root, ".mcp.json"))).toBe(false);
    expect(existsSync(join(fixture.root, ".kimi-code/mcp.json"))).toBe(false);
    const bundle = ".artifacts/mcp-client-configs/";
    expect(
      fixture.json(bundle + "claude/.mcp.json").mcpServers[
        "m2commerce-production"
      ].type,
    ).toBe("http");
    expect(fixture.json(bundle + "muse/settings.json")).toEqual({
      schema_version: 1,
      mcpServers: {
        "m2commerce-production": {
          type: "streamable-http",
          url: "https://mcp.m2commerce.ru/mcp",
          required: false,
        },
      },
    });
    expect(
      fixture.json(bundle + "kimi/.kimi-code/mcp.json").mcpServers[
        "m2commerce-production"
      ],
    ).toEqual({ url: "https://mcp.m2commerce.ru/mcp" });
    expect(fixture.read(bundle + "deepseek/mcp-client.yaml")).toContain(
      "failOnStartupError: false",
    );
  });

  test("configures Kimi without reading another client's broken configuration", () => {
    fixture.envFile();
    fixture.write("opencode.json", '{"mcp":');
    fixture.write(".mcp.json", '{"mcpServers":');

    fixture.generate(["--client", "kimi"]);

    expect(fixture.json(".kimi-code/mcp.json")).toEqual({
      mcpServers: {
        "m2commerce-production": { url: "https://mcp.m2commerce.ru/mcp" },
      },
    });
    expect(fixture.read("opencode.json")).toBe('{"mcp":');
    expect(fixture.read(".mcp.json")).toBe('{"mcpServers":');
  });

  test("rejects JSONC in Kimi's strict JSON file before writing it", () => {
    fixture.envFile();
    const original =
      '{\n// This is not valid Kimi JSON.\n"mcpServers":{},\n}\n';
    fixture.write(".kimi-code/mcp.json", original);
    const result = fixture.generate(["--client", "kimi"], { success: false });
    expect(result.stderr).toContain("requires strict JSON");
    expect(fixture.read(".kimi-code/mcp.json")).toBe(original);
  });

  test("rejects an unknown client without activating any project files", () => {
    fixture.envFile();
    const before = fixture.snapshot();
    const result = fixture.generate(["--client", "unknown"], {
      success: false,
    });
    expect(result.stderr).toContain("Unknown MCP client");
    expect(fixture.snapshot()).toEqual(before);
  });

  test("preserves MiMo JSONC provider settings when adding an MCP connection", () => {
    fixture.envFile();
    fixture.write(
      ".mimocode/mimocode.jsonc",
      '{\n// Keep the model provider.\n"model":"xiaomi/my-model",\n"mcp":{},\n}\n',
    );
    fixture.generate(["--client", "mimo"]);
    expect(fixture.json(".mimocode/mimocode.jsonc").model).toBe(
      "xiaomi/my-model",
    );
    expect(fixture.read(".mimocode/mimocode.jsonc")).toContain(
      "// Keep the model provider.",
    );
    expect(
      fixture.json(".mimocode/mimocode.jsonc").mcp["m2commerce-production"]
        .type,
    ).toBe("remote");
    expect(existsSync(join(fixture.root, ".mcp.json"))).toBe(false);
  });

  test("exports Muse without replacing an existing Claude project file", () => {
    fixture.envFile();
    fixture.write(
      ".mcp.json",
      '{"mcpServers":{"custom":{"type":"http","url":"https://custom.example/mcp"}}}',
    );
    const before = fixture.read(".mcp.json");
    fixture.generate(["--client", "muse"]);
    expect(fixture.read(".mcp.json")).toBe(before);
    expect(
      fixture.json(".artifacts/mcp-client-configs/muse/settings.json")
        .schema_version,
    ).toBe(1);
  });

  test("normalizes dotted repository names for Claude's server name contract", () => {
    fixture.envFile();
    fixture.generate(["--repo-name", "client.shop", "--client", "claude"]);
    expect(Object.keys(fixture.json(".mcp.json").mcpServers)).toEqual([
      "client-shop-production",
    ]);
  });

  test("bounds the DeepSeek server namespace for a long repository name", () => {
    fixture.envFile();
    fixture.generate([
      "--client",
      "deepseek",
      "--repo-name",
      "very-long-repository-name-with-many-characters",
    ]);
    const doc = fixture.read(
      ".artifacts/mcp-client-configs/deepseek/mcp-client.yaml",
    );
    const serverName = JSON.parse(doc.match(/serverName: (".*")/)![1]);
    expect(serverName.length).toBeLessThanOrEqual(32);
    expect(serverName).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(doc).toContain("transport: streamable-http");
    expect(existsSync(join(fixture.root, "cordis.patch.yml"))).toBe(false);
  });

  test("keeps generated connections ignored while retaining shared Codex defaults", () => {
    const env = fixture.envFile();
    writeFileSync(
      env,
      fixture
        .read("tools/deployer/.env")
        .replace("owner/m2commerce", "customer/client-shop")
        .replace("m2commerce.ru", "client-shop.example"),
    );
    for (const file of [
      ".gitignore",
      ".codex/config.toml.example",
      ".cursor/mcp.json.example",
      ".mcp.json.example",
    ])
      fixture.write(file, readFileSync(join(SOURCE_ROOT, file), "utf8"));
    fixture.run(["git", "init"]);
    fixture.run([
      "git",
      "remote",
      "add",
      "origin",
      "https://github.com/customer/client-shop.git",
    ]);
    fixture.run([
      "git",
      "add",
      ".gitignore",
      ".codex/config.toml.example",
      ".cursor/mcp.json.example",
      ".mcp.json.example",
    ]);
    const before = fixture.run(["git", "status", "--porcelain"]).stdout;

    fixture.generate();

    expect(fixture.run(["git", "status", "--porcelain"]).stdout).toBe(before);
    const defaults = fixture.toml(".codex/config.toml.example");
    expect(fixture.toml().profiles).toEqual(defaults.profiles);
    expect(fixture.toml().agents).toEqual(defaults.agents);
    expect(Object.keys(fixture.toml().mcp_servers)).toEqual([
      "client-shop-production",
    ]);
    expect(Object.keys(fixture.json(".mcp.json").mcpServers)).toEqual([
      "client-shop-production",
    ]);
    expect(
      fixture.json(".mcp.json").mcpServers["client-shop-production"].url,
    ).toBe("https://mcp.client-shop.example/mcp");
  });

  test("rejects an inherited deployment endpoint before creating client connections", () => {
    fixture.envFile();
    fixture.run(["git", "init"]);
    fixture.run([
      "git",
      "remote",
      "add",
      "origin",
      "https://github.com/customer/client-shop.git",
    ]);

    const result = fixture.generate([], { success: false });

    expect(result.stderr).toContain(
      "Deployment repository m2commerce differs from checkout client-shop",
    );
    expect(existsSync(join(fixture.root, ".mcp.json"))).toBe(false);
    expect(existsSync(join(fixture.root, ".codex/config.toml"))).toBe(false);
  });

  test("generates all client formats from the downstream deployer env", () => {
    fixture.envFile(
      'MCP_SERVICE_SUBDOMAIN=content\nRBAC_SECRET_KEY=do-not-copy\nUNRELATED_SECRET="unterminated\n',
    );
    const result = fixture.generate(["--opencode-version", "1"]);
    const name = "m2commerce-production";
    const url = "https://content.m2commerce.ru/mcp";
    expect(fixture.json(".mcp.json").mcpServers[name]).toEqual({
      type: "http",
      url,
    });
    expect(fixture.json(".cursor/mcp.json").mcpServers[name]).toEqual({ url });
    expect(fixture.json(".vscode/mcp.json").servers[name]).toEqual({
      type: "http",
      url,
    });
    expect(fixture.json("opencode.json").mcp[name]).toEqual({
      type: "remote",
      url,
      oauth: { scope: "mcp:content" },
      enabled: true,
    });
    expect(fixture.toml().mcp_servers[name].url).toBe(url);
    for (const relative of [
      ".mcp.json",
      ".cursor/mcp.json",
      ".vscode/mcp.json",
      "opencode.json",
      ".codex/config.toml",
    ]) {
      expect(fixture.read(relative)).not.toContain("RBAC_SECRET_KEY");
      expect(fixture.read(relative)).not.toContain("127.0.0.1");
    }
    expect(result.stdout).toContain("opencode mcp auth m2commerce-production");
  });

  test("retains V1 NX server comments, trailing commas and settings", () => {
    fixture.envFile();
    fixture.write(
      "opencode.jsonc",
      '{\n  // Keep this NX server.\n  "model": "provider/model",\n  "mcp": {\n    "nx-mcp": {"type": "local", "command": ["npx", "nx", "mcp"], "enabled": true},\n  },\n}\n',
    );
    fixture.generate();
    expect(fixture.read("opencode.jsonc")).toContain("// Keep this NX server.");
    expect(fixture.read("opencode.jsonc")).toContain(
      '"nx-mcp": {"type": "local", "command": ["npx", "nx", "mcp"], "enabled": true}',
    );
    expect(fixture.json("opencode.jsonc").model).toBe("provider/model");
    expect(fixture.json("opencode.jsonc").mcp).toHaveProperty(
      "m2commerce-production",
    );
    expect(existsSync(join(fixture.root, "opencode.json"))).toBe(false);
  });

  test("retains V2 settings in an OpenCode directory config", () => {
    fixture.envFile();
    fixture.write(
      ".opencode/opencode.json",
      JSON.stringify({
        mcp: {
          timeout: { startup: 50000 },
          servers: {
            "nx-mcp": {
              type: "local",
              command: ["npx", "nx", "mcp"],
              disabled: true,
            },
          },
        },
      }),
    );
    fixture.generate();
    const document = fixture.json(".opencode/opencode.json");
    expect(document.mcp.timeout).toEqual({ startup: 50000 });
    expect(document.mcp.servers["nx-mcp"].disabled).toBe(true);
    expect(document.mcp.servers["m2commerce-production"]).not.toHaveProperty(
      "enabled",
    );
  });

  test("detects the installed OpenCode version for a new config", () => {
    fixture.envFile();
    fixture.write("bin/opencode", "#!/bin/bash\nprintf '1.2.3\\n'\n", 0o755);
    fixture.environment.PATH =
      join(fixture.root, "bin") + ":" + fixture.environment.PATH;
    fixture.generate();
    expect(fixture.json("opencode.json").mcp).toHaveProperty(
      "m2commerce-production",
    );
  });

  test("env can select V2 for a new config", () => {
    fixture.envFile("MCP_CLIENT_OPENCODE_VERSION=2\n");
    fixture.generate();
    expect(fixture.json("opencode.json").mcp.servers).toHaveProperty(
      "m2commerce-production",
    );
  });

  test("explicit URL and process env override the deployer file", () => {
    fixture.envFile(
      "MCP_SERVICE_PUBLIC_URL=https://mcp.file.example/mcp\nMCP_CLIENT_OPENCODE_VERSION=2\n",
    );
    fixture.environment.MCP_SERVICE_PUBLIC_URL =
      "https://mcp.process.example/mcp";
    fixture.generate();
    expect(
      fixture.json("opencode.json").mcp.servers["m2commerce-production"].url,
    ).toBe("https://mcp.process.example/mcp");
    fixture.generate(["--remote-url", "https://mcp.cli.example/mcp/"]);
    expect(
      fixture.json("opencode.json").mcp.servers["m2commerce-production"].url,
    ).toBe("https://mcp.cli.example/mcp");
  });

  test("duplicate env variables abort generation", () => {
    fixture.envFile("DOMAIN=another.example\n");
    const before = fixture.snapshot();
    fixture.generate([], { success: false });
    expect(fixture.snapshot()).toEqual(before);
  });

  test("repeated generation is idempotent and updates a changed URL", () => {
    fixture.envFile();
    fixture.write(
      ".codex/config.toml",
      '[agents]\nmax_threads = 6\n\n[mcp_servers.other]\nurl = "https://other.example/mcp"\n',
    );
    fixture.write(
      ".mcp.json",
      '{"mcpServers":{"local":{"command":"bun","args":["server.ts"]}}}',
    );
    fixture.generate(["--opencode-version", "2"]);
    const first = fixture.snapshot();
    fixture.generate(["--opencode-version", "2"]);
    expect(fixture.snapshot()).toEqual(first);
    fixture.generate([
      "--remote-url",
      "https://mcp.new-domain.example/mcp",
      "--opencode-version",
      "2",
    ]);
    expect(fixture.json(".mcp.json").mcpServers).toHaveProperty("local");
    expect(fixture.toml().agents).toEqual({ max_threads: 6 });
    expect(fixture.toml().mcp_servers.other.url).toBe(
      "https://other.example/mcp",
    );
    expect(fixture.toml().mcp_servers["m2commerce-production"].url).toBe(
      "https://mcp.new-domain.example/mcp",
    );
  });

  test("Codex quoted names, nested tables and other values survive", () => {
    const original =
      '[profiles.safe]\napproval_policy = "on-request"\n\n[mcp_servers."child.app-production"]\nurl = "https://old.example/mcp"\nstartup_timeout_sec = 40\n\n[mcp_servers."child.app-production".http_headers]\n"X-Custom" = "value"\n\n[mcp_servers.other]\nurl = "https://other.example/mcp"\n';
    const generated = editCodex(
      original,
      "child.app-production",
      "https://new.example/mcp",
    );
    const parsed = Bun.TOML.parse(generated) as any;
    expect(parsed.mcp_servers["child.app-production"].startup_timeout_sec).toBe(
      40,
    );
    expect(parsed.mcp_servers["child.app-production"].http_headers).toEqual({
      "X-Custom": "value",
    });
    expect(generated).toContain(
      '[profiles.safe]\napproval_policy = "on-request"',
    );
  });

  test("preview does not replace the production connector", () => {
    fixture.envFile();
    fixture.generate(["--opencode-version", "2"]);
    fixture.generate([
      "--environment",
      "preview",
      "--remote-url",
      "https://mcp.preview.example/mcp",
    ]);
    const servers = fixture.json("opencode.json").mcp.servers;
    expect(servers["m2commerce-production"].url).toBe(
      "https://mcp.m2commerce.ru/mcp",
    );
    expect(servers["m2commerce-preview"].url).toBe(
      "https://mcp.preview.example/mcp",
    );
  });

  test("missing remote skips without resolving a repository or creating files", () => {
    const result = fixture.generate(["--if-configured"]);
    expect(result.stdout).toContain("Skipping");
    expect(fixture.snapshot()).toEqual({});
  });

  test("missing remote requires configuration in manual mode", () => {
    fixture.generate(["--repo-name", "child"], { success: false });
    expect(fixture.snapshot()).toEqual({});
  });

  test("rejects invalid production URLs before writing", () => {
    fixture.envFile();
    const before = fixture.snapshot();
    for (const url of [
      "http://127.0.0.1:3001/mcp",
      "https://mcp.<domain>/mcp",
      "https://user:secret@example.com/mcp",
      "https://example.com/mcp?key=secret",
      "https://example.com/",
      "https://example.com/mcp#fragment",
    ]) {
      fixture.generate(["--remote-url", url], { success: false });
      expect(fixture.snapshot()).toEqual(before);
    }
  });

  test("an invalid client file prevents all writes", () => {
    fixture.envFile();
    for (const [client, relative, content] of [
      ["opencode", "opencode.json", '{"mcp":'],
      ["codex", ".codex/config.toml", "[invalid"],
      ["cursor", ".cursor/mcp.json", '{"mcpServers":{},"mcpServers":{}}'],
      ["vscode", ".vscode/mcp.json", '{"extra":[{"same":1,"same":2}]}'],
    ]) {
      fixture.write(relative, content);
      const before = fixture.snapshot();
      fixture.generate(["--client", client], { success: false });
      expect(fixture.snapshot()).toEqual(before);
      rmSync(join(fixture.root, relative));
    }
  });

  test("preflight validates without creating files", () => {
    fixture.envFile("MCP_CLIENT_OPENCODE_VERSION=1\n");
    const before = fixture.snapshot();
    fixture.generate(["--check-clients"], { generate: false });
    expect(fixture.snapshot()).toEqual(before);
  });

  test("rejects a misplaced server and conflicting OpenCode version", () => {
    fixture.envFile();
    fixture.write(
      "opencode.json",
      '{"mcp":{},"m2commerce-production":{"type":"remote"}}',
    );
    let before = fixture.snapshot();
    fixture.generate([], { success: false });
    expect(fixture.snapshot()).toEqual(before);
    fixture.write(
      "opencode.json",
      '{"mcp":{"nx":{"type":"local","command":["npx","nx","mcp"]}}}',
    );
    before = fixture.snapshot();
    fixture.generate(["--opencode-version", "2"], { success: false });
    expect(fixture.snapshot()).toEqual(before);
  });

  test("rejects multiple OpenCode configs without overwriting", () => {
    fixture.envFile();
    fixture.write("opencode.json", "{}");
    fixture.write("opencode.jsonc", "{}");
    const before = fixture.snapshot();
    fixture.generate([], { success: false });
    expect(fixture.snapshot()).toEqual(before);
  });

  test("a bundle contains only generated public entries", () => {
    fixture.envFile();
    fixture.write(
      ".mcp.json",
      '{"mcpServers":{"private":{"headers":{"Authorization":"do-not-export"}}}}',
    );
    fixture.write(
      "opencode.jsonc",
      '{"mcp":{"nx-mcp":{"type":"local","command":["npx","nx","mcp"]}}}',
    );
    const before = fixture.read(".mcp.json");
    fixture.generate([
      "--output-dir",
      join(fixture.root, "bundle"),
      "--opencode-version",
      "1",
    ]);
    expect(fixture.read(".mcp.json")).toBe(before);
    const bundle = fixture.json("bundle/opencode/opencode.json");
    expect(bundle.mcp).toHaveProperty("m2commerce-production");
    expect(bundle.mcp).not.toHaveProperty("nx-mcp");
    for (const [file, bytes] of Object.entries(fixture.snapshot())) {
      if (file.startsWith("bundle/"))
        expect(Buffer.from(bytes, "base64").toString()).not.toContain(
          "do-not-export",
        );
    }
  });

  test("legacy local project setup keeps remote servers", () => {
    fixture.write(
      ".mcp.json",
      '{"mcpServers":{"other-production":{"type":"http","url":"https://other.example/mcp"}}}',
    );
    fixture.generate(["--write-project", "--repo-name", "child"], {
      generate: false,
    });
    expect(fixture.json(".mcp.json").mcpServers).toHaveProperty(
      "other-production",
    );
    expect(fixture.json(".mcp.json").mcpServers.child.command).toBe("bun");
  });

  test("successful deploy exports a bundle without creating active client configs", () => {
    fixture.installHooks();
    fixture.envFile(
      "API_SERVICE_DOCKER_HUB_REPOSITORY_NAME=owner/image\nMCP_CLIENT_OPENCODE_VERSION=1\n",
    );
    fixture.deploy("down");
    expect(existsSync(join(fixture.root, "opencode.json"))).toBe(false);
    expect(
      existsSync(join(fixture.root, ".artifacts/mcp-client-configs")),
    ).toBe(false);
    fixture.deploy();
    for (const path of [
      "opencode.json",
      ".mcp.json",
      ".codex/config.toml",
      ".cursor/mcp.json",
      ".vscode/mcp.json",
    ])
      expect(existsSync(join(fixture.root, path))).toBe(false);
    expect(
      fixture.json(".artifacts/mcp-client-configs/opencode/opencode.json").mcp[
        "m2commerce-production"
      ].url,
    ).toBe("https://mcp.m2commerce.ru/mcp");
  });

  test("failed deploy and a disabled image do not generate configs", () => {
    fixture.installHooks();
    fixture.envFile();
    fixture.deploy();
    expect(existsSync(join(fixture.root, "opencode.json"))).toBe(false);
    expect(
      existsSync(join(fixture.root, ".artifacts/mcp-client-configs")),
    ).toBe(false);
    fixture.envFile("API_SERVICE_DOCKER_HUB_REPOSITORY_NAME=owner/image\n");
    for (const play of ["./mcp/create_mcp.yaml", "./mcp/fill_github.yaml"]) {
      fixture.environment.MOCK_DEPLOY_FAIL = play;
      fixture.deploy("up", "", false);
      expect(existsSync(join(fixture.root, "opencode.json"))).toBe(false);
      expect(
        existsSync(join(fixture.root, ".artifacts/mcp-client-configs")),
      ).toBe(false);
    }
  });

  test("an unrelated invalid editor config does not block deployment bundle export", () => {
    fixture.installHooks();
    fixture.envFile("API_SERVICE_DOCKER_HUB_REPOSITORY_NAME=owner/image\n");
    fixture.write("opencode.json", '{"mcp":');
    fixture.write(
      "tools/deployer/domain.sh",
      "#!/bin/bash\ntouch external-operation-started\nexit 0\n",
      0o755,
    );
    fixture.deploy("up");
    expect(
      existsSync(
        join(fixture.root, "tools/deployer/external-operation-started"),
      ),
    ).toBe(true);
    expect(fixture.read("opencode.json")).toBe('{"mcp":');
  });

  test("CI deploy exports without changing checkout client configs", () => {
    fixture.installHooks();
    fixture.envFile(
      "API_SERVICE_DOCKER_HUB_REPOSITORY_NAME=owner/image\nMCP_CLIENT_OPENCODE_VERSION=1\n",
    );
    fixture.write(
      ".mcp.json",
      '{"mcpServers":{"private":{"headers":{"Authorization":"do-not-export"}}}}',
    );
    const before = fixture.read(".mcp.json");
    fixture.environment.MCP_CLIENT_CONFIG_OUTPUT_DIR = join(
      fixture.root,
      "bundle",
    );
    fixture.deploy();
    expect(fixture.read(".mcp.json")).toBe(before);
    expect(fixture.json("bundle/opencode/opencode.json").mcp).toHaveProperty(
      "m2commerce-production",
    );
    expect(fixture.read("bundle/claude/.mcp.json")).not.toContain(
      "do-not-export",
    );
  });

  test("local deployment preserves all five existing client configurations", () => {
    fixture.installHooks();
    fixture.envFile("API_SERVICE_DOCKER_HUB_REPOSITORY_NAME=owner/image\n");
    fixture.generate();
    const files = [
      "opencode.json",
      ".mcp.json",
      ".codex/config.toml",
      ".cursor/mcp.json",
      ".vscode/mcp.json",
    ];
    const before = files.map((file) => fixture.read(file));

    fixture.deploy();

    expect(files.map((file) => fixture.read(file))).toEqual(before);
    expect(
      fixture.json(".artifacts/mcp-client-configs/claude/.mcp.json").mcpServers,
    ).toHaveProperty("m2commerce-production");
  });

  test("preview deploy uses its actual domain and environment", () => {
    fixture.installHooks();
    const envFile = fixture.envFile(
      "API_SERVICE_DOCKER_HUB_REPOSITORY_NAME=owner/image\nMCP_CLIENT_OPENCODE_VERSION=1\n",
    );
    writeFileSync(
      envFile,
      fixture
        .read("tools/deployer/.env")
        .replace("DOMAIN=m2commerce.ru", "DOMAIN=preview.m2commerce.ru"),
    );
    fixture.deploy("up", "preview");
    expect(
      fixture.json(".artifacts/mcp-client-configs/opencode/opencode.json").mcp[
        "m2commerce-preview"
      ].url,
    ).toBe("https://mcp.preview.m2commerce.ru/mcp");
  });

  test("env bootstrap leaves client connections unchanged even when MCP is configured", () => {
    fixture.installHooks();
    fixture.envFile("MCP_CLIENT_OPENCODE_VERSION=1\n");
    for (const app of ["db", "redis", "host", "api", "telegram", "mcp"])
      fixture.write(
        `apps/${app}/create_env.sh`,
        "#!/bin/bash\nexit 1\n",
        0o755,
      );
    fixture.write(
      ".mcp.json",
      '{"mcpServers":{"custom":{"url":"https://custom.example/mcp"}}}',
    );
    for (const path of ["apps/db/up.sh", "apps/redis/up.sh", "bin/npx"])
      fixture.write(path, "#!/bin/bash\nexit 0\n", 0o755);
    fixture.environment.START_LLM = "false";
    const before = fixture.snapshot();
    fixture.run(["bash", "./create_env.sh"]);
    fixture.run(["bash", "./up.sh"]);
    expect(fixture.snapshot()).toEqual(before);
  });

  test("runtime container env does not generate client configs", () => {
    fixture.installHooks();
    fixture.envFile();
    mkdirSync(join(fixture.root, "apps/mcp"), { recursive: true });
    fixture.run(["bash", "./create_env.sh", "mcp", "deployment"]);
    expect(existsSync(join(fixture.root, "apps/mcp/.env"))).toBe(true);
    expect(existsSync(join(fixture.root, "opencode.json"))).toBe(false);
  });

  test("Bun launcher does not load an ambient .env over the deployer settings", () => {
    fixture.installHooks();
    fixture.envFile("MCP_CLIENT_OPENCODE_VERSION=2\n");
    fixture.write(
      ".env",
      "MCP_SERVICE_PUBLIC_URL=https://implicit.example/mcp\n",
    );
    fixture.run([
      "bash",
      "tools/mcp/setup-project-mcp.sh",
      "--write-clients",
      "--client",
      "opencode",
    ]);
    expect(
      fixture.json("opencode.json").mcp.servers["m2commerce-production"].url,
    ).toBe("https://mcp.m2commerce.ru/mcp");
  });

  test("atomic updates retain existing client file permissions", () => {
    fixture.envFile();
    const destination = fixture.write(".mcp.json", "{}\n", 0o600);
    fixture.generate(["--opencode-version", "2"]);
    expect(statSync(destination).mode & 0o777).toBe(0o600);
    expect(
      readdirSync(fixture.root).some((name) => name.endsWith(".tmp")),
    ).toBe(false);
  });

  test("apply flags register both clients and authenticate Codex with the same scopes", () => {
    fixture.envFile();
    for (const client of ["claude", "codex"])
      fixture.write(
        `bin/${client}`,
        '#!/bin/bash\nprintf "%s %s\\n" "${0##*/}" "$*" >> "$MCP_CALL_LOG"\n',
        0o755,
      );
    fixture.environment.PATH =
      join(fixture.root, "bin") + ":" + fixture.environment.PATH;
    fixture.environment.MCP_CALL_LOG = join(fixture.root, "client-calls.txt");
    fixture.generate(["--apply-claude", "--apply-codex"], { generate: false });
    expect(fixture.read("client-calls.txt").trim().split("\n")).toEqual([
      "claude mcp add --transport http m2commerce-local http://127.0.0.1:3001/mcp",
      "claude mcp add --transport http m2commerce-production https://mcp.m2commerce.ru/mcp",
      "codex mcp add m2commerce-local --url http://127.0.0.1:3001/mcp",
      "codex mcp login m2commerce-local --scopes mcp:content",
      "codex mcp add m2commerce-production --url https://mcp.m2commerce.ru/mcp",
      "codex mcp login m2commerce-production --scopes mcp:content",
    ]);
  });
});
