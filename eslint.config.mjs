import { defineFlatConfig } from "eslint-define-config";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import jsoncParser from "jsonc-eslint-parser";
import prettier from "eslint-plugin-prettier";
import nxPlugin from "@nx/eslint-plugin";

export default defineFlatConfig([
  {
    ignores: ["node_modules/", ".nx/", "dist/", "tmp/", "apps/host/.next/"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: ["./tsconfig.base.json"],
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
      "@typescript-eslint/no-unsafe-function-type": "warn",
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
    },
    plugins: {
      "@nx": nxPlugin,
    },
    rules: {
      "no-prototype-builtins": "warn",
      "no-self-assign": "warn",
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: false,
          banTransitiveDependencies: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.json"],
    languageOptions: {
      parser: jsoncParser,
    },
    rules: {},
  },
  {
    files: ["./package.json", "./generators.json"],
    languageOptions: {
      parser: jsoncParser,
    },
    rules: {
      "@nx/nx-plugin-checks": "warn",
    },
  },
  {
    rules: {
      "comma-dangle": "off",
      quotes: ["warn", "double"],
      semi: "off",
      "no-duplicate-imports": "error",
      "no-empty-pattern": "off",
      "array-callback-return": "off",
      indent: "off",
      "multiline-ternary": "off",
      "no-loss-of-precision": "off",
      "no-prototype-builtins": "warn",
    },
  },
]);
