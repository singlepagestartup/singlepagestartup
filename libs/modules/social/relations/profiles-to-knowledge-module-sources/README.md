# profiles-to-knowledge-module-sources

Links a Social profile to a Knowledge Source. RBAC uses these links to determine the permitted Source IDs for retrieval and editing. A unique profile/Source pair prevents duplicate access links. Removing this relation preserves Source and its Files.

Use `product-specification` to link a product expert’s source to one store and one offer. Each expert can link up to four sources per offer, with up to 16 KiB of title and text per source. Checkout captures those texts for the purchaser when payment settles. Later consultations read the current sources. Personal notes are excluded from this relation and from the purchase archive.
