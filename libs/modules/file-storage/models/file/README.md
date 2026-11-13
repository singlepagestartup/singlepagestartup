# File Storage File Model

## Purpose

Files store uploaded media and metadata for images, videos, and documents.

File Storage does not import Knowledge. Its service deletes the stored bytes
and the File record, and ordinary updates use the model's CRUD repository.
Knowledge owns operations that also rebuild Sources using that File.

## Fields

- `id`: unique identifier (UUID).
- `file`: file path or URL.
- `containerClassName`: optional container CSS class name.
- `className`: optional CSS class name for media.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `width`: media width.
- `height`: media height.
- `alt`: alt text.
- `size`: file size.
- `extension`: file extension.
- `mimeType`: MIME type.

## Image generation templates

The Host image generator reads receipt and product-attachment backgrounds by
saved File UUID through the server SDK. The File must match the requested
template variant. PNG, JPEG, WebP, GIF and AVIF bytes are accepted up to 5 MiB;
the MIME label and a file URL supplied in the render payload are not trusted.
The route uses ordinary File read access and adds no operator credentials.
The renderer receives an embedded image, so it does not fetch the internal API
address itself. Open Graph uses Host's fixed local favicon.

## Variants

- `default`: renders image/video output based on MIME type.
- `attachment-ai-chat`: compact card that opens a centered file preview dialog.
- `find`: data-fetch wrapper for querying files.
- `admin-form`: admin create/edit form for file metadata.
- `admin-select-input`: admin select input for choosing a file.
- `admin-table`: admin table listing files.
- `admin-table-row`: admin row showing file fields.

The effective File service exposes stored-byte reads, path imports and transaction-bound reference/update locks for consuming services. Its repository owns File table SQL. Knowledge supplies its attachment policy before an import and before creating a Knowledge relation; File Storage remains independent of Knowledge.

## Attachment preview

`attachment-ai-chat` uses the shared record reader and `FilePreview` UI adapter
for Knowledge and message attachments. A parent with an authorized File result
passes `dataSource="props"`; the card does not repeat the metadata query or
mount another Provider. The shared reader passes the loaded File to the
`index.tsx` renderer, which selects only the File, variant and language for
`client.tsx`. The client reader composes a lazy JSX text-reader slot and passes
it through `Component.tsx` to `ClientComponent.tsx`. Views do not import the
local reader; SDK bindings and request options stay above the client boundary.

The local `client.tsx` reads original text only while its preview is open using
`fileApi.previewText`. This separate byte query belongs to the shared React
Query client, carries File realtime topics and keys its result by ID, path and
`updatedAt`. It stays fresh for 60 seconds and is removed after 120 seconds
without observers. The original bytes do not enter the global action debug
snapshot. Both declared and streamed text sizes are limited to 2 MiB.

`fileApi.download({ src, signal? })` retrieves public original bytes without
credentials for PDF rendering and the Download action. Preview does not widen
File metadata access. PDF pages render in the browser through the app's lazy
PDF.js bundle; images support zoom, Markdown has formatted/source modes, and
text formats use a scrolling plain-text view. The Social message composer also
accepts HTML and HTM. Knowledge source uploads keep their own format list.
Legacy SVG attachments keep their noninteractive card.

Opening an HTML attachment reads up to 2 MiB into an isolated document.
Inline JavaScript runs there. Scripts and stylesheets may load from
`cdn.tailwindcss.com`, `cdn.jsdelivr.net` and `cdnjs.cloudflare.com`.
The attachment has an opaque origin. The enclosing frame restricts navigation
to data documents, and the inherited content policy blocks API requests.
The viewer also offers source text and a download. A draft never links to a
top-level Blob document. External CDN requests disclose the viewer's IP to the
CDN. Only open an interactive preview when you want its scripts to run.

## Protected article media

`ProtectedMediaProvider` receives a principal/article/slot scope key from the
granted RBAC content boundary. Within that subtree, the registered
`authenticated-content` variant reads original bytes through `fileApi.content`
and displays a Blob URL. It receives already loaded metadata and does not add
a second record query or SDK Provider. Public `default` rendering is unchanged.

Byte queries belong to React Query, carry File realtime topics and the captured
API-host/principal scope, and are cancelled and removed when that scope closes.
Blob URLs are revoked on replacement, denial and unmount. A 401/403 removes the
previous source immediately; transient failures preserve currently mounted media
while exposing Retry. No protected Blob enters the global action debug snapshot.

### Reading file content by ID

`GET` and `HEAD /api/file-storage/files/:uuid/content` resolve a File record
by ID and read the original bytes through the File service. The `content`
SDK operation sends the caller's credentials and supports cancellation.
Responses carry `Cache-Control: private, no-store`. RBAC checks the corresponding
GET or HEAD permission. Both are public by default. To restrict the API download,
bind both permissions to the required role. An exact content path can restrict
one file. Metadata, collection reads and direct storage URLs have separate access rules.

The API also serves local files under `/public/...` by path. Anyone with a
public URL can read those bytes. Both API routes sandbox directly opened
documents and send HTML as an attachment. Raw object-storage URLs use the
storage provider's own delivery headers and access rules.

## Create from a URL

`POST /api/file-storage/files/create-from-url` takes the existing multipart
`data` JSON with a string `url`. The SDK remains `api.createFromUrl(...)`.
The API downloads the bytes through `fetchOutboundUrl`, then writes the file
only after a successful HTTP response within `FILE_STORAGE_MAX_UPLOAD_BYTES`.
Invalid input, forbidden destinations and unsuccessful remote responses answer
400; oversized downloads answer 413. This does not change multipart uploads
or the RBAC permission needed to call the route.

The File service also uses this guard when `readBytes` reads an HTTP(S) address
from saved file metadata, including reads through `/:uuid/content`. Updating a
File location therefore does not bypass the download policy. Its existing
`maxBytes` option (100 MiB by default) supplies the response cap; local stored
paths keep the existing filesystem path checks.

### Destination and redirect rules

- Only HTTP and HTTPS without URL user names/passwords are accepted. Local-file,
  S3, data and FTP schemes are refused before network or filesystem access.
- Every DNS answer must be public. Loopback, private, link-local/metadata, shared,
  multicast, reserved and documentation ranges are refused. IPv4-mapped IPv6
  follows IPv4 rules. IPv4-compatible, NAT64, Teredo and 6to4 destinations are
  refused rather than allowing embedded private addresses.
- Each connection uses the validated IP. The installed Undici client keeps the
  original hostname for Host, SNI and TLS certificate verification. A wrong name
  or untrusted certificate fails before HTTP headers or body are sent. The
  transport ignores environment proxies and global HTTP dispatchers.
- Redirects are checked individually, up to five hops. HTTPS cannot redirect to
  HTTP. A cross-origin GET/HEAD drops every caller-supplied header; a request
  retaining a body or mutation method cannot cross origins. Same-origin 307/308
  retains the body and headers; 303 and POST 301/302 become GET without a body.
- The deadline covers DNS, connection, headers, redirects and body reading.
  Cancellation from the incoming request is forwarded. An OS DNS lookup may
  finish after cancellation, but its answer cannot start a connection.
- Compressed and decoded bytes are bounded. Gzip, deflate and Brotli are decoded
  as streams; unsupported encoding chains are refused. A compressed small file
  cannot bypass the decoded-size limit. Connections and timers are released on
  success, rejection and cancellation.

The client is a direct root dependency, `undici@8.12.4`, imported through
`undici/index.js` to avoid Bun's partial built-in compatibility module. Native
Bun 1.3.6 fetch cannot combine IP pinning with pre-request hostname verification
using its custom certificate callback. No application-wide fetch replacement
or TLS-verification bypass is installed.

### Internal access

User downloads do not automatically trust every API/Host service route.
`POST /api/file-storage/files/generate` still works: the download handler permits
its exact server-constructed URL under
`HOST_SERVICE_URL/api/image-generator/image.png`, including the requested query.
That exception does not grant another internal path or a redirected internal URL.

Trusted Broadcast observer steps explicitly use `{ allowServiceOrigins: true }`.
They may call the origins of `API_SERVICE_URL`, `NEXT_PUBLIC_API_SERVICE_URL`,
`HOST_SERVICE_URL` and `NEXT_PUBLIC_HOST_SERVICE_URL`. Their writes and headers
still follow the redirect rules above. Access to configure observer messages
must remain restricted through RBAC.

| Variable                          | Default    | Meaning                                                                                                                                   |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `OUTBOUND_URL_ALLOWED_ORIGINS`    | empty      | Extra trusted origins for both download and observer calls, e.g. `http://crm:8080`; bypasses IP restrictions for all paths on that origin |
| `OUTBOUND_URL_TIMEOUT_MS`         | `30000`    | Total deadline, including DNS and the complete response                                                                                   |
| `OUTBOUND_URL_MAX_RESPONSE_BYTES` | `52428800` | Observer response limit; File Storage uses `FILE_STORAGE_MAX_UPLOAD_BYTES` instead                                                        |

Keep the allowlist empty unless an integration needs internal access. A user
with download permission can request any path on an explicitly allowed origin;
do not list an infrastructure or administrative service merely to make a URL
pass. Environment and policy options are controlled by server code, not request
fields. Calling `assertOutboundUrl` followed by ordinary `fetch` would lose IP
pinning; consumers must use `fetchOutboundUrl` for the whole operation.

### Scope of protection

These rules protect server-side downloading. They do not scan file contents for
malware, change access to stored files, or replace sandboxed HTML/SVG delivery.
HTTP remains permitted and has no TLS confidentiality; use HTTPS when transport
integrity matters. RBAC and deployment rate/concurrency limits remain necessary:
per-download limits do not impose a total memory or storage quota across callers.
Use network egress rules to restrict private services as an additional boundary,
especially where public IPs route back to internal systems or custom translation
prefixes are configured. Public IP fallback is not automatic: a failed selected
address fails that attempt rather than resolving the name a second time.

### Reproducing the security integration test

`tools/dev/outbound-url.test.ts` runs real HTTP/HTTPS servers and the real Hono
download handler with the local storage provider. Initial DNS answers and record
persistence are fixtures; the File service's CRUD base is stubbed so the test
opens no database connection. It checks the bytes written to disk, TLS before
HTTP, IP pinning against a localhost trap, redirects, cancellation, timeouts,
compressed limits and rejected imports. It uses no production credentials or
database. Authentication and RBAC are not exercised by this fixture app; it
tests the handler and the download boundary.

Run from the repository root with installed dependencies, Docker and OpenSSL.
The public-shaped subnet belongs only to this temporary `--internal` network:

```bash
fixture_dir=$(mktemp -d)
fixture_network="sps-outbound-test-$$"
cleanup() {
  docker network rm "$fixture_network" >/dev/null 2>&1 || true
  rm -rf "$fixture_dir"
}
trap cleanup EXIT

openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$fixture_dir/key.pem" -out "$fixture_dir/cert.pem" \
  -days 1 -subj /CN=download.test \
  -addext subjectAltName=DNS:download.test,DNS:other.test,DNS:localhost
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$fixture_dir/untrusted-key.pem" -out "$fixture_dir/untrusted-cert.pem" \
  -days 1 -subj /CN=download.test -addext subjectAltName=DNS:download.test

docker network create --internal --subnet 93.184.215.0/24 "$fixture_network"
docker run --rm --read-only --tmpfs /tmp \
  --network "$fixture_network" --ip 93.184.215.2 --workdir /workspace \
  --mount "type=bind,src=$PWD,dst=/workspace,readonly" \
  --mount "type=bind,src=$fixture_dir,dst=/certificates,readonly" \
  --env SPS_TEST_PUBLIC_IP=93.184.215.2 \
  --env SPS_TEST_CERTIFICATES=/certificates \
  --env NODE_EXTRA_CA_CERTS=/certificates/cert.pem \
  oven/bun:1.4.4 bun test --no-env-file tools/dev/outbound-url.test.ts
```

The fixture adds its generated CA to the trust store for this container run.
The tests verify that downloads reject a hostname mismatch and an untrusted
certificate before sending HTTP data.
