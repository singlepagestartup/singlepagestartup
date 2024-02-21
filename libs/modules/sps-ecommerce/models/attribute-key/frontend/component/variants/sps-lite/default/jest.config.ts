/* eslint-disable */
export default {
  displayName:
    "@sps/sps-ecommerce-attribute-key-frontend-component-sps-lite-variants-default",
  preset: "../../../../../../../../../../jest.preset.js",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["babel-jest", { presets: ["@nx/react/babel"] }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory:
    "../../../../../../../../../../coverage/libs/modules/sps-ecommerce/models/attribute-key/frontend/component/variants/sps-lite/default",
};
