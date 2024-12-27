const { defineConfig } = require("eslint-define-config");

module.exports = defineConfig({
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  extends: [
    "next",
    "plugin:react/recommended",
    "plugin:testing-library/react",
    "plugin:storybook/recommended",
    "../../eslint.config.js",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "testing-library"],
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*.js", "*.jsx"],
      rules: {
        "react/no-unescaped-entities": "off",
        "@next/next/no-page-custom-font": "off",
        "react/react-in-jsx-scope": "off",
        "react/display-name": "off",
        "react/prop-types": "off",
        "testing-library/prefer-screen-queries": "warn",
        "testing-library/no-node-access": "warn",
      },
    },
  ],
});
