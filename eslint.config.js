const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
  root: true,
  plugins: ["@nx", "@typescript-eslint", "prettier"],
  extends: ["eslint:recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.base.json"],
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        project: ["./tsconfig.base.json"],
      },
    },
  },
  overrides: [
    {
      files: ["*.json"],
      parser: "jsonc-eslint-parser",
      rules: {},
    },
    {
      files: ["*.ts", "*.tsx"],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@nx/typescript",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": "warn",
        "@typescript-eslint/ban-ts-comment": "warn",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-unused-expressions": "off",
        "no-prototype-builtins": "warn",
        "no-self-assign": "warn",
        "@typescript-eslint/ban-types": "off",
        "@nx/enforce-module-boundaries": [
          "off",
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
      files: ["*.js", "*.jsx"],
      extends: ["plugin:@nx/javascript"],
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
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
      files: ["./package.json", "./generators.json"],
      parser: "jsonc-eslint-parser",
      rules: {
        "@nx/nx-plugin-checks": "warn",
      },
    },
  ],
  rules: {
    "prettier/prettier": "error",
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
  ignores: ["node_modules", ".nx", "dist", "tmp"],
});
