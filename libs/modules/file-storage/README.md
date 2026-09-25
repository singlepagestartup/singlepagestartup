# File Storage Module

## 1. Purpose of the Module

The File Storage module manages uploaded media and file metadata. It provides models for files and widgets that render groups of files.

### It solves the following tasks:

- Stores file metadata and paths.
- Renders images and videos in frontend components.
- Groups files into widgets for reuse.
- Attaches files to other modules through relations.

### Typical use cases:

- Uploading images and videos for content blocks.
- Displaying media galleries or logo strips.
- Associating files with products or articles.

---

## 2. Models

| Model                               | Purpose                             |
| ----------------------------------- | ----------------------------------- |
| [file](./models/file/README.md)     | Uploaded media and metadata         |
| [widget](./models/widget/README.md) | File collections and display groups |

---

## 3. Relations

| Relation                                                   | Purpose               |
| ---------------------------------------------------------- | --------------------- |
| [widgets-to-files](./relations/widgets-to-files/README.md) | Link widgets to files |

---

## 4. Uploads and Delivery

### One file per request

`POST /api/file-storage/files` and `PATCH /api/file-storage/files/:uuid` take a
multipart body with a `data` field holding JSON and one file under the field
`file`. The stored URL is written to the record's `file` column. A request with
more than one file answers `400 Validation error. Multiple files are not
allowed` and stores nothing; send one request per file instead.

### Size limit

`FILE_STORAGE_MAX_UPLOAD_BYTES` (default `52428800`, 50 MiB) bounds the
multipart body of those two routes and the body that
`POST /api/file-storage/files/create-from-url` downloads. A larger upload
answers `400 Validation error. Payload Too Large` before it is buffered. Bun
refuses request bodies above 128 MiB by itself, so a limit above that also needs
`maxRequestBodySize` raised in `apps/api/server.ts`.

### Delivery from the API origin

With the `local` provider, files are written to
`apps/api/public/<FILE_STORAGE_FOLDER>` and served by the API at
`/public/<FILE_STORAGE_FOLDER>/<name>`. Every file response carries two
headers:

- `X-Content-Type-Options: nosniff`: the browser uses the declared type, taken
  from the file extension, instead of guessing one from the content.
- `Content-Security-Policy: sandbox`: a file opened as a document, such as an
  SVG or HTML file in a tab, gets an opaque origin with scripts, forms and
  plugins disabled, so it cannot act as the API origin.

Browsers apply `nosniff` only to script and style loads and a
Content-Security-Policy only to documents and workers, so images, video, audio
and CSS backgrounds that embed these files load as before. A PDF opened in a
tab renders in Chrome and Firefox. Chromium shows a sandboxed PDF blank inside
an `<iframe>`, `<embed>` or `<object>`, and Safari 17.6 was reported to show a
directly opened sandboxed PDF as an empty page.

### Storage providers in production

`FILE_STORAGE_PROVIDER` selects where uploads are stored:

| Provider          | Variables                                                                           | Files are served from                   |
| ----------------- | ----------------------------------------------------------------------------------- | --------------------------------------- |
| `local` (default) | `FILE_STORAGE_FOLDER`                                                               | the API origin, under `/public`         |
| `aws-s3`          | `AWS_S3_BUCKET_NAME`, `AWS_REGION`, and AWS credentials such as `AWS_ACCESS_KEY_ID` | `https://<bucket>.s3.amazonaws.com/...` |
| `vercel-blob`     | `BLOB_READ_WRITE_TOKEN`                                                             | the Vercel Blob store URL               |

Production deployments should use `aws-s3` or `vercel-blob`. Uploaded files
are then served from an origin that holds no session or data of the
application, whatever the file contains. `local` suits development and
deployments that accept uploaded files on the API origin with the headers
above. `tools/deployer/README.md` describes how the Docker deployment selects
the provider.
