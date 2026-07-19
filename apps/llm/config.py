from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # HuggingFace
    hf_token: str = ""

    # OpenAI (for transcription postprocessing and chat gateway)
    openai_api_key: str = ""
    open_ai_api_key: str = ""
    anthropic_api_key: str = ""

    # Gateway
    ollama_url: str = "http://localhost:11434"
    ollama_embed_model: str = "nomic-embed-text"
    ollama_embed_dimensions: int = 768
    llm_preload_model_ids: str = ""
    llm_max_loaded_hf_models: int = 1

    # Whisper
    whisper_model: str = "openai/whisper-small"
    # "cpu" or "cuda" — Docker on Mac always uses cpu
    whisper_device: str = "cpu"
    # "int8" is fastest on cpu; use "float16" for cuda
    whisper_compute_type: str = "int8"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
