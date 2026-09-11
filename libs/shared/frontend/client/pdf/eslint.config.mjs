import baseConfig from "../../../../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    files: ["libs/shared/frontend/client/pdf/**/*.{ts,tsx}"],
    rules: {
      curly: ["error", "all"],
    },
    languageOptions: {
      parserOptions: {
        project: ["./libs/shared/frontend/client/pdf/tsconfig.eslint.json"],
      },
    },
  },
];
