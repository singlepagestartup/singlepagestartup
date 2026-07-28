from config import settings
from singlepage.service import GatewayService
from .catalog import build_catalog

_service: GatewayService | None = None


def get_service() -> GatewayService:
    global _service

    if _service is None:
        _service = GatewayService(
            catalog=build_catalog(
                embedding_provider_model=settings.ollama_embed_model,
                embedding_dimensions=settings.ollama_embed_dimensions,
            ),
            ollama_url=settings.ollama_url,
            anthropic_api_key=settings.anthropic_api_key,
            openai_api_key=settings.openai_api_key or settings.open_ai_api_key,
            max_loaded_hf_models=settings.llm_max_loaded_hf_models,
        )

    return _service


def preload_configured_models() -> None:
    model_ids = [
        model_id.strip()
        for model_id in settings.llm_preload_model_ids.split(",")
        if model_id.strip()
    ]

    if model_ids:
        get_service().preload(model_ids)
