/* eslint-disable */
export default {
  displayName: "@sps/sps-ecommerce-cart-frontend-api",
  preset: "../../../../../../../jest.preset.js",
  transform: {
    "^(?!.*\\.(js|jsx|ts|tsx|css|json)$)": "@nx/react/plugins/jest",
    "^.+\\.[tj]sx?$": ["babel-jest", { presets: ["@nx/react/babel"] }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory:
    "../../../../../../../coverage/libs/modules/sps-ecommerce/models/cart/frontend/api",
};
