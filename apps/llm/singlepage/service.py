from __future__ import annotations

import time
import uuid
from typing import TYPE_CHECKING

from .catalog import ModelCatalog, ModelDefinition, ModelTask, UnknownModelError
from .errors import GatewayError
from .providers import (
    AnthropicProvider,
    HuggingFaceModelManager,
    HuggingFaceProvider,
    OllamaProvider,
    OpenAIProvider,
)

if TYPE_CHECKING:
    from .schemas import ChatCompletionRequest, EmbeddingRequest


class GatewayService:
    def __init__(
        self,
        catalog: ModelCatalog,
        ollama_url: str,
        anthropic_api_key: str,
        openai_api_key: str,
        max_loaded_hf_models: int = 1,
    ):
        self.catalog = catalog
        hf_manager = HuggingFaceModelManager(max_loaded_hf_models)
        self.providers = {
            "ollama": OllamaProvider(ollama_url),
            "anthropic": AnthropicProvider(anthropic_api_key),
            "openai": OpenAIProvider(openai_api_key),
            "huggingface": HuggingFaceProvider(hf_manager),
        }

    def list_models(self, task: ModelTask | None = None) -> dict:
        return {
            "object": "list",
            "data": [model.to_public_dict() for model in self.catalog.list(task)],
        }

    def get_model(self, model_id: str) -> dict:
        try:
            return self.catalog.get(model_id).to_public_dict()
        except UnknownModelError as error:
            raise GatewayError(
                str(error),
                status_code=404,
                error_type="not_found_error",
                details={"available_models": error.available_ids},
            ) from error

    def chat_completion(self, request: ChatCompletionRequest) -> dict:
        if request.stream:
            raise GatewayError(
                "Streaming chat completions are not supported by local LLM gateway yet.",
                status_code=400,
                error_type="unsupported_parameter",
            )

        model = self._get_model(request.model, task="chat")
        provider_skills = self._provider_skills_for_model(request, model)
        provider = self.providers[model.provider]
        result = provider.chat(
            model=model,
            messages=request.messages,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            provider_skills=provider_skills,
        )

        return {
            "id": f"chatcmpl-{uuid.uuid4().hex}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model.id,
            "provider": model.provider,
            "provider_model": model.provider_model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": result.text,
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": result.usage.model_dump() if result.usage else None,
        }

    def embeddings(self, request: EmbeddingRequest) -> dict:
        model = self._get_model(request.model, task="embedding")
        inputs = request.input if isinstance(request.input, list) else [request.input]
        provider = self.providers[model.provider]
        result = provider.embed(model=model, inputs=inputs)

        if len(result.embeddings) != len(inputs):
            raise GatewayError(
                f"Embedding provider returned {len(result.embeddings)} vectors for {len(inputs)} inputs.",
                status_code=500,
                error_type="provider_error",
            )

        if model.dimensions is not None:
            for index, embedding in enumerate(result.embeddings):
                if len(embedding) != model.dimensions:
                    raise GatewayError(
                        f"Embedding {index} has {len(embedding)} dimensions; expected {model.dimensions}.",
                        status_code=500,
                        error_type="provider_error",
                    )

        return {
            "object": "list",
            "model": model.id,
            "provider": model.provider,
            "provider_model": model.provider_model,
            "data": [
                {
                    "object": "embedding",
                    "embedding": embedding,
                    "index": index,
                }
                for index, embedding in enumerate(result.embeddings)
            ],
            "usage": result.usage.model_dump() if result.usage else None,
        }

    def preload(self, model_ids: list[str]) -> None:
        for model_id in model_ids:
            model = self._get_model(model_id, task="chat")
            if model.provider != "huggingface" or model.task != "chat":
                continue

            provider = self.providers["huggingface"]
            provider.manager.get(model)

    def _get_model(self, model_id: str, task: ModelTask) -> ModelDefinition:
        try:
            model = self.catalog.get(model_id)
        except UnknownModelError as error:
            raise GatewayError(
                str(error),
                status_code=404,
                error_type="not_found_error",
                details={"available_models": error.available_ids},
            ) from error

        if model.task != task:
            raise GatewayError(
                f"Model {model_id} has task {model.task}, expected {task}.",
                status_code=400,
                error_type="invalid_request_error",
            )

        return model

    def _provider_skills_for_model(
        self, request: ChatCompletionRequest, model: ModelDefinition
    ) -> list | None:
        if not request.provider_skills:
            return None

        if model.provider not in {"openai", "anthropic"}:
            raise GatewayError(
                f"provider_skills are only supported for openai and anthropic models. Selected provider: {model.provider}.",
                status_code=400,
                error_type="unsupported_parameter",
            )

        mismatched = [
            skill.provider
            for skill in request.provider_skills
            if skill.provider != model.provider
        ]

        if mismatched:
            raise GatewayError(
                f"provider_skills must match selected model provider {model.provider}. Got: {', '.join(sorted(set(mismatched)))}.",
                status_code=400,
                error_type="invalid_request_error",
            )

        return request.provider_skills
