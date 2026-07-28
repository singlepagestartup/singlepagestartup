from singlepage.catalog import ModelCatalog, ModelDefinition


def build_catalog(
    embedding_provider_model: str = "nomic-embed-text",
    embedding_dimensions: int = 768,
) -> ModelCatalog:
    return ModelCatalog(
        [
            ModelDefinition(
                id="qwen/qwen3-1-7b",
                label="Qwen3 1.7B",
                provider="ollama",
                provider_model="qwen3:1.7b",
                task="chat",
                local=True,
            ),
            ModelDefinition(
                id="anthropic/claude-sonnet-4",
                label="Claude Sonnet 4",
                provider="anthropic",
                provider_model="claude-sonnet-4-20250514",
                task="chat",
                local=False,
            ),
            ModelDefinition(
                id="anthropic/claude-opus-4-1",
                label="Claude Opus 4.1",
                provider="anthropic",
                provider_model="claude-opus-4-1-20250805",
                task="chat",
                local=False,
            ),
            ModelDefinition(
                id="openai/gpt-5-2",
                label="OpenAI GPT-5.2",
                provider="openai",
                provider_model="gpt-5.2",
                task="chat",
                local=False,
            ),
            ModelDefinition(
                id="openai/gpt-5-5",
                label="OpenAI GPT-5.5",
                provider="openai",
                provider_model="gpt-5.5",
                task="chat",
                local=False,
            ),
            ModelDefinition(
                id="local/default-embedding",
                label="Configured Ollama Embedding Model",
                provider="ollama",
                provider_model=embedding_provider_model,
                task="embedding",
                local=True,
                dimensions=embedding_dimensions,
            ),
        ]
    )
