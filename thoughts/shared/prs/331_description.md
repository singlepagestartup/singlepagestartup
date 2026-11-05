Closes #304.

## File uploads and delivery

When someone opens an uploaded SVG or HTML document, the browser runs it under the API origin unless the response restricts it. Both `/public/...` and `/api/file-storage/files/:uuid/content` now send `Content-Security-Policy: sandbox` and `X-Content-Type-Options: nosniff` on GET and HEAD. The content route retains its private, no-store cache policy. Direct S3 and Vercel Blob URLs use their provider's delivery settings.

File create and update accept one uploaded file per request. A text field with the same name can accompany the file. Two files, including two under the same field name, receive HTTP 400 before storage. A metadata-only PATCH still updates the existing File.

`FILE_STORAGE_MAX_UPLOAD_BYTES` defaults to 50 MiB. It limits the entire multipart body on create and update, and the downloaded response on `create-from-url`. Oversized requests and downloads return HTTP 413. The API uses main's shared error category table. URL destination checks are tracked in #307.

## Verification

- 51 File Storage tests, 177 backend utility tests, 3 module integration tests and 5 HTTP scenario tests passed. File Storage's TypeScript check reports the same five diagnostics as `main`, all in existing frontend and client SDK tests.
- A running API and Chromium exercised the same uploaded SVG by both URLs. Its script was blocked in each document. GET returned the original bytes, HEAD returned the security headers, and deleting the fixture removed the public file.
- With a 4096-byte test limit, declared and chunked uploads received HTTP 413 on POST and PATCH. URL imports accepted the small file and returned 413 for oversized responses with and without a declared length. Multipart POST and PATCH each stored one file accompanied by a text field of the same name.
- The deployer and Ansible workflow were exercised with disposable values and external operations stubbed. Both preview and production rendered the configured limit and the default into the API environment.
- Direct PDF viewing in Safari remains unverified. Chromium's native PDF viewer can show a blank document in a sandboxed frame.

## Downstream migration

- Projects overriding file delivery must send both security headers when returning original bytes, including aliases for the same file. Check GET and HEAD on each URL and open a test SVG that sets a harmless marker in its own document.
- Startup controllers rebinding the upload routes must apply the File model's `RequestBodyFitsUploadLimit` middleware. Send one file per request. Clients handling an oversized body receive HTTP 413.
- Set a custom upload limit in the API environment or in `tools/deployer/.env`. For GitHub Actions, sync the production or preview secret with the deployer's normal configuration flow. Limits above Bun's own request-body ceiling also require setting `maxRequestBodySize` on the API server.
- Applications embedding uploaded PDFs should verify their preview in supported browsers. The SPS attachment preview reads the bytes for PDF.js.
