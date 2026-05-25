from singlepage.catalog import ModelCatalog, ModelDefinition

DEFAULT_WHISPER_MODEL = "openai/whisper-small"


def build_catalog(whisper_model: str = DEFAULT_WHISPER_MODEL) -> ModelCatalog:
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
                id="huggingface/qwen2-5-0-5b-instruct",
                label="HuggingFace Qwen2.5 0.5B Instruct",
                provider="huggingface",
                provider_model="Qwen/Qwen2.5-0.5B-Instruct",
                task="chat",
                local=True,
                hf_task="text-generation",
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
                id="nomic/nomic-embed-text",
                label="Nomic Embed Text",
                provider="ollama",
                provider_model="nomic-embed-text",
                task="embedding",
                local=True,
                dimensions=768,
            ),
            ModelDefinition(
                id=whisper_model,
                label="Whisper Small",
                provider="huggingface",
                provider_model=whisper_model,
                task="audio",
                local=True,
                aliases=("whisper-1",),
            ),
        ]
    )
