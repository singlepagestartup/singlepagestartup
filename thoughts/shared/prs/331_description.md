Closes #304.

## File uploads and delivery

When someone opens an uploaded SVG or HTML document, the browser runs it under the API origin unless the response restricts it. Both `/public/...` and `/api/file-storage/files/:uuid/content` send a sandbox policy and `X-Content-Type-Options: nosniff` on GET and HEAD. HTML downloads as an attachment. Markup documents such as SVG also block external subresources. The content route retains its private, no-store cache policy. Direct S3 and Vercel Blob URLs use their provider's delivery settings.

File create and update accept one uploaded file per request. A text field with the same name can accompany the file. Two files, including two under the same field name, receive HTTP 400 before storage. A metadata-only PATCH updates the existing File. Social messages accept multiple uploads in one multipart request. The Subject handler sends one File Storage request per attachment.

`FILE_STORAGE_MAX_UPLOAD_BYTES` defaults to 50 MiB. It limits the entire multipart body on create and update, and the downloaded response on `create-from-url`. Oversized requests and downloads return HTTP 413. The API uses main's shared error category table. Server-side URL destination checks are tracked in #307. The separate API-wide CORS allowlist is tracked in #308.

## HTML attachments in Social

Social AI Chat accepts HTML and HTM attachments. Opening a draft or stored
attachment renders up to 2 MiB in a sandbox with an opaque origin. A separate
outer document restricts the attachment's navigation. Inline JavaScript and
scripts or styles from the Tailwind Play CDN, jsDelivr and cdnjs are allowed.
The policy blocks API connections, forms, popups and top-level navigation.
Users can switch to escaped source text or download the file.

## Verification

- A temporary Subject sent one Social AI Chat message with HTML, Markdown and TXT using its session JWT. The response and a fresh thread read returned the same three distinct Files in order. Each file’s bytes matched the input, and the three persisted message relations had order indices 0, 1 and 2. A metadata-only update preserved the stored path. Replacing the middle attachment kept its File ID, its position and the other two files’ bytes. A direct File Storage POST or PATCH with two files returned HTTP 400.

- 52 File Storage tests, 16 Social composer/handler tests, 6 Social message-list tests, 2 attachment-format tests, 177 backend utility tests, 3 module integration tests and 6 HTTP scenario tests passed. File Storage's TypeScript check reports the same five diagnostics as `main`, all in existing frontend and client SDK tests.
- A running API and Chromium exercised the same uploaded SVG by both URLs. Its script was blocked in each document. GET returned the original bytes, HEAD returned the security headers, and deleting the fixture removed the public file.
- Chromium and macOS WebKit opened the attachment dialog with HTML uploaded to the running API. In both engines the v4 jsDelivr script applied the expected Tailwind styles and Day.js loaded from cdnjs. Chromium also rendered the legacy Tailwind CDN version. A listener recorded zero requests from the hostile attachment to the test server during credentialed POST, image, script, nested frame, link and form probes. Browser storage and the parent document were inaccessible.
- With a 4096-byte test limit, declared and chunked uploads received HTTP 413 on POST and PATCH. URL imports accepted the small file and returned 413 for oversized responses with and without a declared length. Multipart POST and PATCH each stored one file accompanied by a text field of the same name.
- The deployer and Ansible workflow were exercised with disposable values and external operations stubbed. Both preview and production rendered the configured limit and the default into the API environment.
- Direct PDF viewing in Safari remains unverified. Chromium's native PDF viewer can show a blank document in a sandboxed frame.

## Downstream migration

- Projects overriding file delivery must apply `getFileContentHeaders(path, mimeType)` when returning original bytes, including aliases for the same file. Check GET and HEAD on each URL and open a test SVG that sets a harmless marker in its own document.
- Startup controllers rebinding the upload routes must apply the File model's `RequestBodyFitsUploadLimit` middleware. Send one file per request. Clients handling an oversized body receive HTTP 413.
- Set a custom upload limit in the API environment or in `tools/deployer/.env`. For GitHub Actions, sync the production or preview secret with the deployer's normal configuration flow. Limits above Bun's own request-body ceiling also require setting `maxRequestBodySize` on the API server.
- Applications embedding uploaded PDFs should verify their preview in supported browsers. The SPS attachment preview reads the bytes for PDF.js.
- Projects overriding the Social composer must opt into the message attachment formats on both select and submit. Keep the same sandbox and CDN policy in custom HTML viewers. Test one inline script, one allowed external script and one denied API request.
