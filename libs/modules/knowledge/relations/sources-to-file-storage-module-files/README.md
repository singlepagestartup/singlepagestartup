# sources-to-file-storage-module-files

Links a Knowledge Source to ordered File Storage Files. The Source/File pair is unique; one Source can have several Files, and Files may be shared by Sources or messages.

Create, update, and delete invalidate generated descriptions and chunks in the same transaction as the relation change. Every current attachment is then analyzed again. Moving a relation rebuilds both Sources. User context survives reconstruction and processing errors. Batch upload/replace uses one reconstruction after saving the complete set of links.

Detaching this relation preserves the File. Source deletion preserves all original Files.

The relation service owns ordered link reads and writes and obtains Files through the effective File Storage service. Generic relation mutations use the Source aggregate transaction and post-commit reconstruction. New associations validate the complete File payload by bytes, MIME and extension; SVG and SVGZ are rejected. Legacy unsupported attachments remain stored and appear as blocked cards. Read projections mark unsupported/unavailable Files without updating their stored records.
