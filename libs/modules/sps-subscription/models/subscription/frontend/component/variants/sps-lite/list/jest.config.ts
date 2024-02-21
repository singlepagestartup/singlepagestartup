/* eslint-disable */
export default {
  displayName:
    "@sps/sps-subscription-subscription-frontend-component-sps-lite-variants-list",
  preset: "../../../../../../../../../../jest.preset.js",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["babel-jest", { presets: ["@nx/react/babel"] }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory:
    "../../../../../../../../../../coverage/libs/modules/sps-subscription/models/subscription/frontend/component/variants/sps-lite/list",
};
