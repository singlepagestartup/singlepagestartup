# Funnel

The store funnel configuration applies to new and open tasks as soon as it is saved.

The server derives each slug from the funnel name when it creates the funnel or
backfills an existing funnel. The slug stays stable after a rename and is
unique within the store. The store CRM reserves `new` for creating a funnel.

## Linear stages in the store editor

The editor saves stages in their displayed order. On a stage assigned to an AI employee, each customer or employee message triggers a separate check of the completion condition against the conversation. A positive decision advances to the next active stage. A negative decision leaves the task on its current stage. Staff can also complete an ordinary stage manually. The checkout stage uses the payment recorded on the order. A review stage uses the customer’s acceptance of the current result.

When the response deadline expires, the task closes without a result. Its linked order is marked canceled while it is still awaiting fulfillment.

For commissioned files, the customer can request changes, accept the preview and pay the quoted price in the order chat. The assigned agent can then send the purchased file according to the stage instructions.

The AI fee uses the provider’s actual USD cost multiplied by the number of platform tokens per USD in the reference wallet top-up package and by the stage multiplier. The installation can select its reference package with `AI_WORK_TOKEN_TOPUP_PRODUCT_ID`. A multiplier of zero makes the interaction free for the customer. Customers approve the stage rate before paid work starts. The wallet reserves the estimated amount for each call. Earlier stage and message limits do not cap customer-priced work. When an older stage first adopts customer pricing, its multiplier starts at zero until the store sets a rate.

See the [CRM workflow contract](../../README.md#store-workflows).
