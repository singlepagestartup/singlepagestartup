/* eslint-disable */
export default {
  displayName:
    "@sps/sps-website-builder-products-list-block-contracts-extended",
  preset: "../../../../../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory:
    "../../../../../coverage/libs/modules/sps-website-builder/products-list-block/contracts-extended",
};
