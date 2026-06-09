from dataclasses import asdict, dataclass


@dataclass
class Usage:
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0

    def model_dump(self) -> dict:
        return asdict(self)


@dataclass
class ChatResult:
    text: str
    usage: Usage | None = None


@dataclass
class EmbeddingResult:
    embeddings: list[list[float]]
    usage: Usage | None = None
