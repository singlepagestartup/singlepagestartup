from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

ModelProvider = Literal["ollama", "anthropic", "openai", "huggingface"]
ModelTask = Literal["chat", "embedding", "audio"]


class UnknownModelError(ValueError):
    def __init__(self, model_id: str, available_ids: list[str]):
        self.model_id = model_id
        self.available_ids = available_ids
        super().__init__(
            f"Unknown model: {model_id}. Available models: {', '.join(available_ids)}."
        )


@dataclass(frozen=True)
class ModelDefinition:
    id: str
    label: str
    provider: ModelProvider
    provider_model: str
    task: ModelTask
    local: bool
    dimensions: int | None = None
    aliases: tuple[str, ...] = ()
    hf_task: str | None = None

    def to_public_dict(self) -> dict:
        data = {
            "id": self.id,
            "object": "model",
            "label": self.label,
            "provider": self.provider,
            "provider_model": self.provider_model,
            "task": self.task,
            "local": self.local,
        }

        if self.dimensions is not None:
            data["dimensions"] = self.dimensions

        return data


class ModelCatalog:
    def __init__(self, models: list[ModelDefinition]):
        self._models = {model.id: model for model in models}
        self._aliases = {
            alias: model.id for model in models for alias in model.aliases
        }

    def list(self, task: ModelTask | None = None) -> list[ModelDefinition]:
        models = list(self._models.values())

        if task:
            models = [model for model in models if model.task == task]

        return models

    def get(self, model_id: str) -> ModelDefinition:
        resolved_id = self._aliases.get(model_id, model_id)
        model = self._models.get(resolved_id)

        if not model:
            raise UnknownModelError(model_id, self.available_ids())

        return model

    def available_ids(self, task: ModelTask | None = None) -> list[str]:
        return [model.id for model in self.list(task)]
