import { defineFlatConfig } from "eslint-define-config";
import parentConfig from "../../eslint.config.mjs";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";

export default defineFlatConfig([
  ...parentConfig,
  {
    files: ["e2e/**/*.ts", "playwright.config.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ["./tsconfig.spec.json"],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      prettier: prettier,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-types": "off",
      "prettier/prettier": "error",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["e2e/**/*.ts", "playwright.config.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      prettier: prettier,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-types": "off",
      "prettier/prettier": "error",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]);
