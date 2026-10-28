# Metadata → File Storage File

This Host-owned relation attaches fallback social covers to Metadata. It stores
`metadataId`, `fileStorageModuleFileId`, `orderIndex`, `variant` and standard
ID/timestamps. Deleting Metadata cascades its links; deleting a link preserves
the File. File records and uploaded bytes remain owned by File Storage.

The SEO resolver sorts visible links by orderIndex then ID and selects the first
visible image File. A hidden link or File removes only that cover. Both admin
form generations manage links; the admin-v2 Metadata panel can open the File
editor to upload or edit the cover. The standard relation SDK/API/MCP contracts
apply. Public reads filter hidden before pagination; authorized admin reads use
`includeHidden=1`.
