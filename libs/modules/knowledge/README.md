# Knowledge Module

## Purpose

The Knowledge module stores editable markdown documents, indexes them into PostgreSQL with pgvector, retrieves relevant text chunks with embeddings from the local `apps/llm` gateway, and generates source-grounded answers for AdminV2 users through selectable local or hosted models.

## Models

| Model                                   | Purpose                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| [document](./models/document/README.md) | Editable markdown source of truth                         |
| [source](./models/source/README.md)     | Derived index record for a document or imported file      |
| [chunk](./models/chunk/README.md)       | Searchable text fragment with a 768-dimensional embedding |
| edit-suggestion                         | Pending markdown create/update suggestion                 |

Documents connect to `social/profile` through the social-owned `profiles-to-knowledge-module-documents` relation. Sources connect to chunks through the `sources-to-chunks` SPS relation. Sources also connect to uploaded file-storage records through `sources-to-file-storage-module-files`, so imported files can be viewed from admin UI.

## Runtime Requirements

- PostgreSQL must run from `pgvector/pgvector:pg17`.
- The shared migration wrapper creates the `vector` extension before repository migrations run.
- `apps/llm` serves the OpenAI-compatible local gateway for embeddings, local models, HuggingFace presets, Claude, and OpenAI.
- Knowledge owns RAG data and vector search; provider routing and model catalog live in `apps/llm`.

Environment variables:

| Variable                    | Default                       | Purpose                                 |
| --------------------------- | ----------------------------- | --------------------------------------- |
| `LLM_SERVICE_URL`           | `http://localhost:8765`       | Local gateway URL used by Knowledge     |
| `KNOWLEDGE_EMBEDDING_MODEL` | `nomic/nomic-embed-text`      | Gateway embedding model id              |
| `OLLAMA_MODELS`             | `nomic-embed-text,qwen3:1.7b` | Ollama models pulled by `apps/llm` init |
| `ANTHROPIC_API_KEY`         | empty                         | Anthropic key consumed by `apps/llm`    |
| `OPENAI_API_KEY`            | empty                         | OpenAI key consumed by `apps/llm`       |

Generation model slugs are loaded from `GET /api/knowledge/models?task=chat`, which proxies `apps/llm`.

| Slug                                | Provider    | Provider model               |
| ----------------------------------- | ----------- | ---------------------------- |
| `qwen/qwen3-1-7b`                   | Ollama      | `qwen3:1.7b`                 |
| `huggingface/qwen2-5-0-5b-instruct` | HuggingFace | `Qwen/Qwen2.5-0.5B-Instruct` |
| `anthropic/claude-sonnet-4`         | Anthropic   | `claude-sonnet-4-20250514`   |
| `anthropic/claude-opus-4-1`         | Anthropic   | `claude-opus-4-1-20250805`   |
| `openai/gpt-5-2`                    | OpenAI      | `gpt-5.2`                    |
| `openai/gpt-5-5`                    | OpenAI      | `gpt-5.5`                    |

## Startup

Start core infrastructure:

```bash
./up.sh
```

Start the LLM gateway explicitly when indexing/searching with embeddings:

```bash
START_LLM=true ./up.sh
```

or:

```bash
cd apps/llm
./up.sh
```

The LLM compose stack includes Ollama plus an init service that pulls every model listed in `OLLAMA_MODELS`. HuggingFace presets are loaded lazily unless `LLM_PRELOAD_MODEL_IDS` is set in `apps/llm/.env`.

## Migrations

Generate migrations after schema changes:

```bash
NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/knowledge:repository-generate
```

Run only knowledge migrations:

```bash
NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/knowledge:repository-migrate
```

Run normal API migrations, including knowledge:

```bash
NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:db:migrate
```

Do not hand-edit Drizzle migration SQL, snapshots, or journal files for table-field changes. Change the schema and run the repository generator target.

## Indexing

Dry-run discovery and chunking without writing rows or calling Ollama:

```bash
npm run knowledge:index -- --dry-run --limit=5
```

Index a bounded sample:

```bash
npm run knowledge:index -- --limit=5
```

Clear derived Knowledge rows before a full reindex:

```bash
npm run knowledge:index -- --clear
```

Index from a custom root:

```bash
npm run knowledge:index -- --root=tools/digital-agency/project/content/video --limit=5
```

The indexer treats `knowledge/document.description` as the source of truth. File discovery remains an import path for source transcripts and canonical content only: `content.txt`, `content.md`, `transcript.txt`, `transcript.md`, `transcription.txt`, and `transcription.md` are read into editable documents first, then documents are indexed into derived Source and Chunk rows. Generated outputs such as `description.md` and `youtube_description.md` are intentionally ignored. Unchanged document hashes are skipped when the source still has chunk relations.

## API

The module is mounted at `/api/knowledge`.

Custom routes:

- `GET /api/knowledge/status`
- `GET /api/knowledge/models?task=chat|embedding|audio`
- `POST /api/knowledge/search`
- `POST /api/knowledge/generate`
- `POST /api/knowledge/index`
- `POST /api/knowledge/documents/:id/reindex`
- `POST /api/knowledge/chat/messages`
- `POST /api/knowledge/edit-suggestions/:id/approve`
- `POST /api/knowledge/edit-suggestions/:id/reject`

CRUD routes for `document`, `edit-suggestion`, `source`, `chunk`, `sources-to-chunks`, and `sources-to-file-storage-module-files` remain available through their generated apps and SDKs. Profile-document links are managed by the Social module at `/api/social/profiles-to-knowledge-module-documents`.

## AdminV2

The host AdminV2 shell registers the Knowledge module under `/admin/knowledge`.

Routes:

- `/admin/knowledge`: search, generate, and sample indexing panel.
- `/admin/knowledge/document`: editable markdown documents.
- `/admin/knowledge/source`: generated source admin table.
- `/admin/knowledge/chunk`: generated chunk admin table.
- `/admin/knowledge/edit-suggestion`: generated edit suggestion admin table.

Social Profile forms show linked Knowledge Documents through `profiles-to-knowledge-module-documents`. Source forms show related Files and Chunks through admin-v2 relation tables. Chunk forms show related Sources through the `sources-to-chunks` relation table.

Frontend code must use the knowledge SDK actions instead of ad hoc fetches.

## Troubleshooting

- `extension "vector" is not available`: rebuild the DB container after changing `apps/db/Dockerfile` to `pgvector/pgvector:pg17`, then rerun migrations.
- `LLM embedding request failed`: start `apps/llm` and verify `GET http://localhost:8765/v1/models` responds.
- `ANTHROPIC_API_KEY is not set`: set the key in `apps/llm/.env` before using Claude models.
- Wrong embedding dimension: `nomic/nomic-embed-text` must return 768 values; other embedding models are rejected until Knowledge supports variable vector dimensions.
