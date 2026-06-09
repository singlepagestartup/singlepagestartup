from __future__ import annotations

from collections import OrderedDict
import gc
import os

from .catalog import ModelDefinition
from .errors import GatewayError
from .results import ChatResult, EmbeddingResult, Usage


def _settings():
    from config import settings

    return settings


def _usage(
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    total_tokens: int | None = None,
) -> Usage | None:
    prompt = prompt_tokens or 0
    completion = completion_tokens or 0
    total = total_tokens if total_tokens is not None else prompt + completion

    if prompt == 0 and completion == 0 and total == 0:
        return None

    return Usage(
        prompt_tokens=prompt,
        completion_tokens=completion,
        total_tokens=total,
    )


def _messages_to_prompt(messages: list[ChatMessage]) -> str:
    return "\n\n".join([f"{message.role}: {message.content}" for message in messages])


def _openai_skill_payload(skill: ProviderSkillReference) -> dict:
    payload = {
        "type": "skill_reference",
        "skill_id": skill.provider_skill_id,
    }

    if skill.version:
        payload["version"] = skill.version

    return payload


def _anthropic_skill_payload(skill: ProviderSkillReference) -> dict:
    payload = {
        "type": "custom",
        "skill_id": skill.provider_skill_id,
    }

    if skill.version:
        payload["version"] = skill.version

    return payload


class OllamaProvider:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def chat(
        self,
        model: ModelDefinition,
        messages: list[ChatMessage],
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider_skills: list[ProviderSkillReference] | None = None,
    ) -> ChatResult:
        import requests

        payload = {
            "model": model.provider_model,
            "stream": False,
            "messages": [message.model_dump() for message in messages],
        }

        options = {}
        if temperature is not None:
            options["temperature"] = temperature
        if max_tokens is not None:
            options["num_predict"] = max_tokens
        if options:
            payload["options"] = options

        response = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=180)

        if not response.ok:
            details = response.text[:500]
            raise GatewayError(
                f"Ollama generation request failed with status {response.status_code}. Response: {details} Ensure apps/llm is running and {model.provider_model} is pulled. Run: npm run llm:dev.",
                status_code=500,
                error_type="provider_error",
            )

        data = response.json()

        return ChatResult(
            text=(data.get("message") or {}).get("content", "").strip(),
            usage=_usage(
                prompt_tokens=data.get("prompt_eval_count"),
                completion_tokens=data.get("eval_count"),
            ),
        )

    def embed(self, model: ModelDefinition, inputs: list[str]) -> EmbeddingResult:
        import requests

        response = requests.post(
            f"{self.base_url}/api/embed",
            json={"model": model.provider_model, "input": inputs},
            timeout=180,
        )

        if not response.ok:
            details = response.text[:500]
            raise GatewayError(
                f"Ollama embedding request failed with status {response.status_code}. Response: {details} Ensure apps/llm is running and {model.provider_model} is pulled. Run: npm run llm:dev.",
                status_code=500,
                error_type="provider_error",
            )

        data = response.json()
        embeddings = data.get("embeddings")
        if embeddings is None and data.get("embedding") is not None:
            embeddings = [data["embedding"]]
        embeddings = embeddings or []

        return EmbeddingResult(
            embeddings=embeddings,
            usage=_usage(prompt_tokens=data.get("prompt_eval_count")),
        )


class AnthropicProvider:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def chat(
        self,
        model: ModelDefinition,
        messages: list[ChatMessage],
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider_skills: list[ProviderSkillReference] | None = None,
    ) -> ChatResult:
        if not self.api_key:
            raise GatewayError(
                "ANTHROPIC_API_KEY is not set",
                status_code=500,
                error_type="configuration_error",
            )

        from anthropic import Anthropic

        client = Anthropic(api_key=self.api_key)
        system = "\n\n".join(
            [message.content for message in messages if message.role == "system"]
        )
        anthropic_messages = [
            {"role": message.role, "content": message.content}
            for message in messages
            if message.role in {"user", "assistant"}
        ]

        if not anthropic_messages:
            anthropic_messages = [{"role": "user", "content": ""}]

        payload = {
            "model": model.provider_model,
            "max_tokens": max_tokens or 1800,
            "temperature": temperature if temperature is not None else 0.2,
            "messages": anthropic_messages,
            **({"system": system} if system else {}),
        }

        if provider_skills:
            beta_messages = getattr(getattr(client, "beta", None), "messages", None)

            if beta_messages is None:
                raise GatewayError(
                    "Anthropic provider_skills require the beta Messages API.",
                    status_code=400,
                    error_type="unsupported_parameter",
                )

            message = beta_messages.create(
                **payload,
                betas=[
                    "code-execution-2025-08-25",
                    "skills-2025-10-02",
                    "files-api-2025-04-14",
                ],
                container={
                    "skills": [
                        _anthropic_skill_payload(skill)
                        for skill in provider_skills
                    ]
                },
                tools=[{"type": "code_execution_20250825", "name": "code_execution"}],
            )
        else:
            message = client.messages.create(**payload)
        text = "".join(
            [block.text for block in message.content if getattr(block, "type", "") == "text"]
        ).strip()
        input_tokens = getattr(message.usage, "input_tokens", 0)
        output_tokens = getattr(message.usage, "output_tokens", 0)

        return ChatResult(
            text=text,
            usage=_usage(
                prompt_tokens=input_tokens,
                completion_tokens=output_tokens,
            ),
        )


class OpenAIProvider:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def _supports_temperature(self, model: ModelDefinition) -> bool:
        return not model.provider_model.startswith("gpt-5")

    def _raise_provider_error(self, error: Exception) -> None:
        status_code = int(getattr(error, "status_code", 500) or 500)
        details = str(error)[:500]
        raise GatewayError(
            f"OpenAI generation request failed with status {status_code}. Response: {details}",
            status_code=500,
            error_type="provider_error",
        ) from error

    def chat(
        self,
        model: ModelDefinition,
        messages: list[ChatMessage],
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider_skills: list[ProviderSkillReference] | None = None,
    ) -> ChatResult:
        if not self.api_key:
            raise GatewayError(
                "OPENAI_API_KEY is not set",
                status_code=500,
                error_type="configuration_error",
            )

        from openai import OpenAI

        client = OpenAI(api_key=self.api_key)
        input_messages = [message.model_dump() for message in messages]

        try:
            if provider_skills and not hasattr(client, "responses"):
                raise GatewayError(
                    "OpenAI provider_skills require the Responses API.",
                    status_code=400,
                    error_type="unsupported_parameter",
                )

            if hasattr(client, "responses"):
                payload = {
                    "model": model.provider_model,
                    "input": input_messages,
                    "max_output_tokens": max_tokens or 1800,
                }
                if temperature is not None and self._supports_temperature(model):
                    payload["temperature"] = temperature
                if provider_skills:
                    payload["tools"] = [
                        {
                            "type": "shell",
                            "environment": {
                                "type": "container_auto",
                                "skills": [
                                    _openai_skill_payload(skill)
                                    for skill in provider_skills
                                ],
                            },
                        }
                    ]

                response = client.responses.create(**payload)
                text = getattr(response, "output_text", "") or ""
                usage = getattr(response, "usage", None)
                return ChatResult(
                    text=text.strip(),
                    usage=_usage(
                        prompt_tokens=getattr(usage, "input_tokens", 0),
                        completion_tokens=getattr(usage, "output_tokens", 0),
                        total_tokens=getattr(usage, "total_tokens", 0),
                    ),
                )

            payload = {
                "model": model.provider_model,
                "messages": input_messages,
                "max_completion_tokens": max_tokens or 1800,
            }
            if temperature is not None and self._supports_temperature(model):
                payload["temperature"] = temperature

            response = client.chat.completions.create(**payload)
        except GatewayError:
            raise
        except Exception as error:
            self._raise_provider_error(error)

        choice = response.choices[0] if response.choices else None
        text = choice.message.content if choice and choice.message else ""
        usage = getattr(response, "usage", None)

        return ChatResult(
            text=(text or "").strip(),
            usage=_usage(
                prompt_tokens=getattr(usage, "prompt_tokens", 0),
                completion_tokens=getattr(usage, "completion_tokens", 0),
                total_tokens=getattr(usage, "total_tokens", 0),
            ),
        )


class HuggingFaceModelManager:
    def __init__(self, max_loaded_models: int):
        self.max_loaded_models = max(1, max_loaded_models)
        self._loaded: OrderedDict[str, tuple[object, object]] = OrderedDict()

    def _load(self, model: ModelDefinition) -> tuple[object, object]:
        from transformers import AutoModelForCausalLM, AutoTokenizer

        token = _settings().hf_token or None
        tokenizer = AutoTokenizer.from_pretrained(model.provider_model, token=token)
        causal_model = AutoModelForCausalLM.from_pretrained(
            model.provider_model,
            token=token,
            low_cpu_mem_usage=True,
        )
        causal_model.eval()

        return tokenizer, causal_model

    def get(self, model: ModelDefinition) -> tuple[object, object]:
        if model.id in self._loaded:
            tokenizer, causal_model = self._loaded.pop(model.id)
            self._loaded[model.id] = (tokenizer, causal_model)
            return tokenizer, causal_model

        while len(self._loaded) >= self.max_loaded_models:
            self._loaded.popitem(last=False)
            gc.collect()

        loaded = self._load(model)
        self._loaded[model.id] = loaded
        return loaded


class HuggingFaceProvider:
    def __init__(self, manager: HuggingFaceModelManager):
        self.manager = manager

    def chat(
        self,
        model: ModelDefinition,
        messages: list[ChatMessage],
        temperature: float | None = None,
        max_tokens: int | None = None,
        provider_skills: list[ProviderSkillReference] | None = None,
    ) -> ChatResult:
        import torch

        settings = _settings()

        if settings.hf_token:
            os.environ["HF_TOKEN"] = settings.hf_token

        tokenizer, causal_model = self.manager.get(model)
        prompt_messages = [message.model_dump() for message in messages]

        if hasattr(tokenizer, "apply_chat_template"):
            prompt = tokenizer.apply_chat_template(
                prompt_messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        else:
            prompt = _messages_to_prompt(messages)

        inputs = tokenizer(prompt, return_tensors="pt")
        prompt_tokens = int(inputs["input_ids"].shape[-1])
        generation_kwargs = {
            "max_new_tokens": max_tokens or 512,
            "do_sample": temperature is not None and temperature > 0,
        }

        if temperature is not None and temperature > 0:
            generation_kwargs["temperature"] = temperature

        with torch.no_grad():
            output_ids = causal_model.generate(**inputs, **generation_kwargs)

        generated_ids = output_ids[0][prompt_tokens:]
        text = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        completion_tokens = int(generated_ids.shape[-1])

        return ChatResult(
            text=text,
            usage=_usage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            ),
        )
