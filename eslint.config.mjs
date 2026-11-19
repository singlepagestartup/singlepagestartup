import { defineConfig, globalIgnores } from "eslint/config";
import nxPlugin from "@nx/eslint-plugin";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import * as jsoncParser from "jsonc-eslint-parser";

const javascriptFiles = "**/*.{js,jsx,mjs,cjs}";
const typescriptFiles = "**/*.{ts,tsx,mts,cts}";

export default defineConfig([
  globalIgnores([
    ".artifacts/",
    ".claude/worktrees/",
    ".nx/",
    "**/.next*/",
    "**/coverage/",
    "**/dist/",
    "output/",
    "tmp/",
    "apps/db/db_backups/",
    "apps/db/db_data*/",
    "apps/host/next-env.d.ts",
    "apps/host/public/mockServiceWorker.js",
    "apps/llm/.ollama/",
    "apps/llm/.venv/",
    "apps/redis/redis_data/",
    "apps/studio/.storybook/.generated/",
    "apps/studio/output/",
    // Checkout-local agent settings and MCP client connections.
    ".claude/settings.local.json",
    ".cursor/mcp.json",
    ".kimi-code/mcp.json",
    ".mcp.json",
    ".mimocode/mimocode.{json,jsonc}",
    ".opencode/opencode.{json,jsonc}",
    ".vscode/mcp.json",
    "mimocode.{json,jsonc}",
    "opencode.{json,jsonc}",
    // Portainer webhook files downloaded by the deployer playbooks.
    "tools/deployer/api/api_webhook.json",
    "tools/deployer/host/host_webhook.json",
    "tools/deployer/llm/llm_webhook.json",
    "tools/deployer/mcp/mcp_webhook.json",
    "tools/deployer/telegram/telegram_webhook.json",
  ]),
  {
    files: [javascriptFiles, typescriptFiles],
    rules: {
      "no-duplicate-imports": ["error", { allowSeparateTypeImports: true }],
      "no-prototype-builtins": "warn",
    },
  },
  {
    files: [javascriptFiles],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-self-assign": "warn",
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    ignores: ["tools/deployer/github/github-node-api/**"],
    plugins: { "@nx": nxPlugin },
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        { banTransitiveDependencies: true },
      ],
    },
  },
  {
    files: [typescriptFiles],
    extends: [typescriptPlugin.configs["flat/recommended"]],
    rules: {
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
    },
  },
  {
    files: ["apps/{api,host,mcp}/**/*.{ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", reportUsedIgnorePattern: true },
      ],
    },
  },
  {
    files: ["libs/shared/frontend/client/pdf/**/*.{ts,tsx,mts,cts}"],
    rules: {
      curly: "error",
    },
  },
  {
    files: ["**/*.{json,jsonc}"],
    languageOptions: {
      parser: jsoncParser,
      parserOptions: { jsonSyntax: "JSON" },
    },
  },
  {
    files: [
      "**/*.jsonc",
      "**/tsconfig*.json",
      ".devcontainer/devcontainer.json",
      ".vscode/*.json",
    ],
    languageOptions: {
      parserOptions: { jsonSyntax: "JSONC" },
    },
  },
]);
