export default {
  displayName: "host",
  preset: "../../jest.server-preset.js",
  // The app tsconfig sets `jsx: "preserve"` for Next, which leaves JSX in the
  // transform output, so the specs compile against tsconfig.spec.json instead.
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
  // `server-only` only resolves to its no-op build under the react-server
  // condition, which jest does not set.
  moduleNameMapper: {
    "^server-only$": "<rootDir>/../../node_modules/server-only/empty.js",
  },
};
