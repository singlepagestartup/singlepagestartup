const nxPreset = require("@nx/jest/preset").default;

module.exports = {
  ...nxPreset,
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "html"],
  setupFiles: [`${__dirname}/jest.setup.ts`],
};
