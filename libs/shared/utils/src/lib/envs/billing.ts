/**
 * Stripe credentials
 * @see https://stripe.com/docs/keys
 */
export const STRIPE_PUBLISHABLE_KEY =
  process.env["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"];
export const STRIPE_SECRET_KEY = process.env["STRIPE_SECRET_KEY"];
export const STRIPE_RETURN_URL = process.env["STRIPE_RETURN_URL"];

/**
 * OxProcessing credentials
 * @see https://docs.0xprocessing.com
 */
export const O_X_PROCESSING_SHOP_ID = process.env["O_X_PROCESSING_SHOP_ID"];
export const O_X_PROCESSING_TEST_PAYMENTS =
  process.env["O_X_PROCESSING_TEST_PAYMENTS"];
export const O_X_PROCESSING_WEBHOOK_PASSWORD =
  process.env["O_X_PROCESSING_WEBHOOK_PASSWORD"];
export const O_X_PROCESSING_RETURN_URL =
  process.env["O_X_PROCESSING_RETURN_URL"];

/**
 * Payselection credentials
 * @see https://api.payselection.com
 */
export const PAYSELECTION_RUB_SECRET_KEY =
  process.env["PAYSELECTION_RUB_SECRET_KEY"];
export const PAYSELECTION_RUB_SITE_ID =
  process.env["NEXT_PUBLIC_PAYSELECTION_RUB_SITE_ID"];
export const PAYSELECTION_RUB_SITE_NAME =
  process.env["NEXT_PUBLIC_PAYSELECTION_RUB_SITE_NAME"];
export const PAYSELECTION_RUB_PUBLIC_KEY =
  process.env["NEXT_PUBLIC_PAYSELECTION_RUB_PUBLIC_KEY"];
export const PAYSELECTION_RUB_WEBHOOK_URL =
  process.env["PAYSELECTION_RUB_WEBHOOK_URL"];
export const PAYSELECTION_INT_SECRET_KEY =
  process.env["PAYSELECTION_INT_SECRET_KEY"];
export const PAYSELECTION_INT_SITE_ID =
  process.env["NEXT_PUBLIC_PAYSELECTION_INT_SITE_ID"];
export const PAYSELECTION_INT_SITE_NAME =
  process.env["NEXT_PUBLIC_PAYSELECTION_INT_SITE_NAME"];
export const PAYSELECTION_INT_PUBLIC_KEY =
  process.env["NEXT_PUBLIC_PAYSELECTION_INT_PUBLIC_KEY"];
export const PAYSELECTION_INT_WEBHOOK_URL =
  process.env["PAYSELECTION_INT_WEBHOOK_URL"];

/**
 * Cloudpayments credentials
 * @see https://developers.cloudpayments.ru
 */
export const CLOUDPAYMENTS_PUBLIC_ID = process.env["CLOUDPAYMENTS_PUBLIC_ID"];
export const CLOUDPAYMENTS_API_SECRET = process.env["CLOUDPAYMENTS_API_SECRET"];

/**
 * Tiptoppay credentials
 * @see https://developers.tiptoppay.kz
 */
export const TIPTOPPAY_PUBLIC_ID = process.env["TIPTOPPAY_PUBLIC_ID"];
export const TIPTOPPAY_API_SECRET = process.env["TIPTOPPAY_API_SECRET"];
