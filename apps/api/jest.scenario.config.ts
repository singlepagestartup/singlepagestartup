/* eslint-disable */
export default {
  displayName: "@sps/api:scenario",
  preset: "../../jest.server-preset.js",
  testMatch: [
    "<rootDir>/specs/scenario/**/*.scenario.spec.ts",
    "<rootDir>/specs/scenario/**/*.scenario.spec.tsx",
  ],
  setupFilesAfterEnv: ["<rootDir>/specs/scenario/jest.setup.ts"],
  moduleNameMapper: {
    "^server-only$": "<rootDir>/specs/scenario/test-utils/noop-module.ts",
    "^client-only$": "<rootDir>/specs/scenario/test-utils/noop-module.ts",
  },
  maxWorkers: 1,
};
