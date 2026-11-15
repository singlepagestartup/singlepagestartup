Closes #358.

## Changes

Subject cart creation, product checkout and cart updates accept whole numbers from 1 to 1,000,000 per order line by default. Create and product checkout use 1 when the caller omits the quantity. An out-of-range quantity returns HTTP 400 before the API writes to the order.

Set `ECOMMERCE_ORDER_LINE_MAX_QUANTITY` in the API environment to choose a different upper limit. The configured value must fit the PostgreSQL integer column (1 through 2,147,483,647). An unset or blank value uses the default. An invalid value produces a configuration error at startup.

The existing Subject order list supplies the effective limit in `cartDetails.maxLineQuantity` when the client requests cart details. The update form uses the limit for validation. At the limit, the cart disables the increase button. If a project lowers the limit below a saved quantity, the buyer can reduce it to the new maximum in one click.

## Verification

- Nine focused suites passed with the default and with `ECOMMERCE_ORDER_LINE_MAX_QUANTITY=7` (69 tests per run).
- On the local API, creating a cart line with 1,000,000 units returned HTTP 200. Creation and update with 1,000,001 returned HTTP 400. Reading the cart after the refused update returned a stored quantity of 1,000,000.
- API and Host passed their TypeScript checks. The local Host returned HTTP 200 for `/ru/framework`.
- The preview and production workflows pass the GitHub variable to the deployer. The API environment template was rendered locally with a missing value, a blank value and two explicit limits.

## Downstream migration

Projects that use the default can omit the variable. For a custom limit, set it in `apps/api/.env` locally or in `tools/deployer/.env` for deployment. Apply the new environment to all API instances and reload the cart. Custom cart readers must include `maxLineQuantity` in their cart details response. Custom controls should use that field for validation. Check the exact limit and one unit above it when verifying a deployment.
