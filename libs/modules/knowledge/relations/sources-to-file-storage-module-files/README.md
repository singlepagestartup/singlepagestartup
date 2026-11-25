# sources-to-file-storage-module-files

Links a Knowledge Source to ordered File Storage Files. The Source/File pair is unique; one Source can have several Files, and Files may be shared by Sources or messages.

Create, update, and delete invalidate generated descriptions and chunks in the same transaction as the relation change. The generic relation endpoints keep the user’s notes and leave affected Sources ready for explicit indexing. The profile attachment operation analyzes the final set of Files and publishes its index before commit.

Detaching this relation preserves the File. Source deletion preserves all original Files.

The relation service owns ordered link reads and writes and obtains Files through the effective File Storage service. Moving a relation invalidates derived content on both Sources. New associations validate the complete File payload by bytes, MIME and extension; SVG and SVGZ are rejected. Legacy unsupported attachments remain stored and appear as blocked cards. Read projections mark unsupported/unavailable Files without updating their stored records.
