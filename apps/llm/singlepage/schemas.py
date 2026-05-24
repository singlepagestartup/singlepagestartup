from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatCompletionRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    temperature: float | None = None
    max_tokens: int | None = None
    stream: bool = False


class EmbeddingRequest(BaseModel):
    model: str
    input: str | list[str]


class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ChatResult(BaseModel):
    text: str
    usage: Usage | None = None


class EmbeddingResult(BaseModel):
    embeddings: list[list[float]]
    usage: Usage | None = None


class ModelResponse(BaseModel):
    id: str
    object: Literal["model"] = "model"
    label: str
    provider: str
    provider_model: str = Field(alias="provider_model")
    task: str
    local: bool
    dimensions: int | None = None

    model_config = {
        "populate_by_name": True,
        "protected_namespaces": (),
    }
