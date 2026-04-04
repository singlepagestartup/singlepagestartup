export default {
  displayName: "@sps/rbac",
  preset: "../../../jest.server-preset.js",
  testPathIgnorePatterns: [
    "\\.integration\\.spec\\.ts$",
    "models/subject/backend/app/api/src/lib/controller/singlepage/authentication/email-and-password",
    "models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized",
    "models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts",
  ],
};
