# Knowledge Module

## Purpose

The Knowledge module stores editable markdown documents, indexes them into PostgreSQL with pgvector, retrieves relevant text chunks with embeddings from the local `apps/llm` gateway, and generates source-grounded answers through selectable local or hosted models. It is a generic RAG engine and does not read or write Social/RBAC tables.

## Models

| Model                                   | Purpose                                                   |
| --------------------------------------- | --------------------------------------------------------- |
| [document](./models/document/README.md) | Editable markdown source of truth                         |
| [source](./models/source/README.md)     | Derived index record for a document or imported file      |
| [chunk](./models/chunk/README.md)       | Searchable text fragment with a 768-dimensional embedding |
| edit-suggestion                         | Pending markdown create/update suggestion                 |

Sources connect to chunks through the `sources-to-chunks` SPS relation. Sources also connect to uploaded file-storage records through `sources-to-file-storage-module-files`, so imported files can be viewed from admin UI. Social profile scoping is owned outside this module: RBAC/Social load profile-document links and pass explicit `documentIds` into Knowledge.

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
| `OLLAMA_MODEL_IDS`          | `nomic-embed-text,qwen3:1.7b` | Ollama models pulled by `apps/llm` init |
| `OLLAMA_MODELS_DIR`         | `.ollama/models`              | Project-local native Ollama model cache |
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

The LLM compose stack includes Ollama plus an init service that pulls every model listed in `OLLAMA_MODEL_IDS`. HuggingFace presets are loaded lazily unless `LLM_PRELOAD_MODEL_IDS` is set in `apps/llm/.env`.

For native project-local development without Docker for the LLM gateway:

```bash
npm run llm:install
npm run llm:ollama:start
npm run llm:ollama:pull
npm run llm:dev
```

`npm run llm:dev` starts the Python gateway and tails the project-local Ollama log by default. Ollama state is kept under `apps/llm/.ollama`, and `npm run llm:ollama:stop` stops only the process owned by this project pid file.

## Server Deployment

Production RAG infrastructure is managed by `tools/deployer` in the same flow as `api`, `host`, `mcp`, and `telegram`:

```bash
cd tools/deployer
./llm.sh up
./api.sh up
```

The full deployer bootstrap also starts LLM before API:

```bash
cd tools/deployer
./up.sh
```

Required deployer variables are listed in `tools/deployer/.env.example`:

- `LLM_SERVICE_NAME=llm`
- `LLM_SERVICE_DOCKER_HUB_REPOSITORY_NAME`
- `LLM_SERVICE_URL=http://llm:8765`
- `OLLAMA_MODEL_IDS=nomic-embed-text,qwen3:1.7b`
- optional `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and `HF_TOKEN`

The server stack runs three private Docker Swarm services: the Python LLM gateway, Ollama, and a one-shot Ollama model pull service. LLM is not exposed through Traefik by default; API reaches it through internal overlay DNS at `http://llm:8765`.

Server PostgreSQL must use `pgvector/pgvector:pg17`. The deployer changes only the image, while the existing `/home/code/postgres_data` volume path is preserved.

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

## Social Chat Learning

`social.chat.variant="knowledge"` enables profile-scoped RAG replies through the RBAC subject endpoint `POST /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/knowledge`.

In the Host chat UI, sending a message in a Knowledge chat creates the `social.message` first and then automatically calls the RBAC Knowledge reaction endpoint for the connected AI assistant profile. Users do not need to call the endpoint manually from the browser.

Learning is explicit:

- `/learn Some text to remember` stores the text after `/learn`.
- `/learn` with supported `.txt`, `.md`, or `.markdown` attachments stores those attachments.
- Attachments without `/learn` are sent as normal chat attachments and are not indexed as Knowledge.
- `default` and `telegram` chats do not run Knowledge learning.

Each learned item is stored by RBAC as a deterministic Knowledge document using the replying AI profile id, source message id, optional file id, and content hash. RBAC calls `KnowledgeService.learnContent({ slug, title, content, metadata })`, then links the returned document to the AI profile through the Social-owned `profiles-to-knowledge-module-documents` relation. Each learned document is immediately indexed, which creates sources, chunks, pgvector embeddings, and source/chunk relations through the existing indexer.

Normal non-`/learn` messages in a Knowledge chat are orchestrated by RBAC: it loads document ids linked to the replying AI profile, then calls `KnowledgeService.generate({ query, documentIds, persona })`. An empty `documentIds` array means no documents are searched, so one AI profile cannot fall back to global Knowledge or another profile's documents.

The Knowledge document sidebar in the Social chat UI shows documents linked to the answering AI profile through RBAC-scoped endpoints. Users can edit document `title` and markdown `description` from the sidebar. Saving edits does not reindex automatically; users must click `Reindex`, which calls the RBAC-scoped reindex route after validating the profile-document relation.

## API

The module is mounted at `/api/knowledge`.

Custom routes:

- `GET /api/knowledge/status`
- `GET /api/knowledge/models?task=chat|embedding|audio`
- `POST /api/knowledge/search`
- `POST /api/knowledge/generate`
- `POST /api/knowledge/index`
- `POST /api/knowledge/documents/:id/reindex`
- `POST /api/knowledge/edit-suggestions/:id/approve`
- `POST /api/knowledge/edit-suggestions/:id/reject`

CRUD routes for `document`, `edit-suggestion`, `source`, `chunk`, `sources-to-chunks`, and `sources-to-file-storage-module-files` remain available through their generated apps and SDKs. Profile-document links are managed by the Social module and profile-scoped operations are exposed through RBAC.

Knowledge service methods are social-agnostic:

- `KnowledgeService.search({ query, documentIds?, topK?, minSimilarity? })`
- `KnowledgeService.generate({ query, documentIds?, persona?, generationModelSlug?, topK?, minSimilarity? })`
- `KnowledgeService.learnContent({ slug, title, content, summary?, metadata? })`

## AdminV2

The host AdminV2 shell registers the Knowledge module under `/admin/knowledge`.

Routes:

- `/admin/knowledge`: search, generate, and sample indexing panel.
- `/admin/knowledge/document`: editable markdown documents.
- `/admin/knowledge/source`: generated source admin table.
- `/admin/knowledge/chunk`: generated chunk admin table.
- `/admin/knowledge/edit-suggestion`: generated edit suggestion admin table.

Social Profile forms show linked Knowledge Documents through the Social-owned `profiles-to-knowledge-module-documents` relation. Source forms show related Files and Chunks through admin-v2 relation tables. Chunk forms show related Sources through the `sources-to-chunks` relation table.

Admin/global Knowledge frontend code should use the Knowledge SDK actions instead of ad hoc fetches. Profile-scoped Social chat document UI must use the RBAC scoped SDK actions.

## Troubleshooting

- `extension "vector" is not available`: rebuild the DB container after changing `apps/db/Dockerfile` to `pgvector/pgvector:pg17`, then rerun migrations.
- `LLM embedding request failed`: start `apps/llm` and verify `GET http://localhost:8765/v1/models` responds.
- `ANTHROPIC_API_KEY is not set`: set the key in `apps/llm/.env` before using Claude models.
- Wrong embedding dimension: `nomic/nomic-embed-text` must return 768 values; other embedding models are rejected until Knowledge supports variable vector dimensions.
