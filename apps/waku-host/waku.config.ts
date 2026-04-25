import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import type { Alias, Plugin, ResolvedConfig, UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "waku/config";

function resolveLocalPath(pathname: string) {
  return fileURLToPath(new URL(pathname, import.meta.url));
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function loadTsconfigAliases(): Alias[] {
  const tsconfig = JSON.parse(
    readFileSync(resolveLocalPath("../../tsconfig.base.json"), "utf8"),
  ) as {
    compilerOptions?: {
      paths?: Record<string, string[]>;
    };
  };

  return Object.entries(tsconfig.compilerOptions?.paths || {}).flatMap<Alias>(
    ([find, replacements]) => {
      const replacement = replacements[0];

      if (!replacement) {
        return [];
      }

      if (find.endsWith("/*") && replacement.endsWith("/*")) {
        return [
          {
            find: new RegExp(`^${escapeForRegExp(find.slice(0, -2))}(.*)$`),
            replacement: `${resolveLocalPath(
              `../../${replacement.slice(0, -2)}`,
            )}/$1`,
          },
        ];
      }

      return [
        {
          find,
          replacement: resolveLocalPath(`../../${replacement}`),
        },
      ];
    },
  );
}

function loadNextAliases(): Alias[] {
  return [
    {
      find: /^@uiw\/react-md-editor$/,
      replacement: resolveLocalPath("./src/compat/uiw/react-md-editor.tsx"),
    },
    {
      find: "next/constants",
      replacement: resolveLocalPath("./src/compat/next/constants.ts"),
    },
    {
      find: "next/headers",
      replacement: resolveLocalPath("./src/compat/next/headers.ts"),
    },
    {
      find: "next/image",
      replacement: resolveLocalPath("./src/compat/next/image.tsx"),
    },
    {
      find: "next/link",
      replacement: resolveLocalPath("./src/compat/next/link.tsx"),
    },
    {
      find: "next/navigation",
      replacement: resolveLocalPath("./src/compat/next/navigation.ts"),
    },
    {
      find: "next/script",
      replacement: resolveLocalPath("./src/compat/next/script.tsx"),
    },
    {
      find: "next/types",
      replacement: resolveLocalPath("./src/compat/next/types.ts"),
    },
  ];
}

function loadClientAliases(): Alias[] {
  return [
    {
      find: /^server-only$/,
      replacement: resolveLocalPath("./src/compat/server-only.ts"),
    },
  ];
}

function loadCommonAliases(): Alias[] {
  return [...loadTsconfigAliases(), ...loadNextAliases()];
}

function createEntriesCompatPlugin(): Plugin {
  let resolvedConfig: ResolvedConfig | undefined;

  return {
    name: "waku-dist-entries-compat",
    apply: "build",
    configResolved(config) {
      resolvedConfig = config;
    },
    closeBundle() {
      if (!resolvedConfig) {
        return;
      }

      const outDir = resolve(resolvedConfig.root, resolvedConfig.build.outDir);
      const esmEntriesPath = resolve(outDir, "entries.mjs");

      if (!existsSync(esmEntriesPath)) {
        return;
      }

      const cjsCompatibleEntriesPath = resolve(outDir, "entries.js");
      const distPackageJsonPath = resolve(outDir, "package.json");
      const entriesContent = readFileSync(esmEntriesPath, "utf8")
        .replaceAll("./rsdw-server.js", "./rsdw-server.mjs")
        .replace(/(\.\/assets\/rsf[0-9A-Za-z_-]+)\.js/g, "$1.mjs");

      mkdirSync(dirname(cjsCompatibleEntriesPath), { recursive: true });
      writeFileSync(cjsCompatibleEntriesPath, entriesContent, "utf8");
      writeFileSync(
        distPackageJsonPath,
        JSON.stringify({ type: "module" }, null, 2),
        "utf8",
      );
    },
  };
}

export default defineConfig({
  unstable_viteConfigs: {
    common: (): UserConfig => ({
      plugins: [tsconfigPaths(), tailwindcss(), createEntriesCompatPlugin()],
      resolve: {
        alias: loadCommonAliases(),
      },
      server: {
        fs: {
          allow: [resolveLocalPath("../../"), resolveLocalPath("../host")],
        },
      },
    }),
    "dev-main": (): UserConfig => ({
      define: {
        "process.env": "{}",
      },
      resolve: {
        alias: [...loadCommonAliases(), ...loadClientAliases()],
      },
    }),
    "build-client": (): UserConfig => ({
      define: {
        "process.env": "{}",
      },
      resolve: {
        alias: [...loadCommonAliases(), ...loadClientAliases()],
      },
    }),
  },
});
