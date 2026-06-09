"""
BDD Suite: local LLM gateway service.

Given: apps/llm owns model catalog and provider routing.
When: chat, embedding, and metadata requests are handled.
Then: OpenAI-compatible responses are built without provider logic in callers.
"""

import pathlib
import sys
import types
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from singlepage.catalog import ModelCatalog, ModelDefinition
from singlepage.errors import GatewayError
from singlepage.providers import AnthropicProvider, OpenAIProvider
from singlepage.results import ChatResult, EmbeddingResult, Usage
from singlepage.service import GatewayService


class FakeProvider:
    def __init__(self):
        self.chat_calls = []
        self.embed_calls = []

    def chat(
        self,
        model,
        messages,
        temperature=None,
        max_tokens=None,
        provider_skills=None,
    ):
        self.chat_calls.append(
            {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "provider_skills": provider_skills,
            }
        )
        return ChatResult(
            text="answer",
            usage=Usage(prompt_tokens=3, completion_tokens=2, total_tokens=5),
        )

    def embed(self, model, inputs):
        self.embed_calls.append({"model": model, "inputs": inputs})
        return EmbeddingResult(embeddings=[[0.1, 0.2, 0.3]])


class TestMessage:
    def __init__(self, role, content):
        self.role = role
        self.content = content

    def model_dump(self):
        return {"role": self.role, "content": self.content}


class TestChatRequest:
    def __init__(self, model, messages, provider_skills=None):
        self.model = model
        self.messages = messages
        self.temperature = None
        self.max_tokens = None
        self.stream = False
        self.provider_skills = provider_skills or []


class TestProviderSkill:
    def __init__(
        self,
        provider,
        provider_skill_id,
        version="latest",
        content_hash="hash-1",
        name="brief-writer",
        source_skill_id="skill-1",
    ):
        self.provider = provider
        self.provider_skill_id = provider_skill_id
        self.version = version
        self.content_hash = content_hash
        self.name = name
        self.source_skill_id = source_skill_id


class TestEmbeddingRequest:
    def __init__(self, model, input):
        self.model = model
        self.input = input


def build_service():
    catalog = ModelCatalog(
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
                id="nomic/nomic-embed-text",
                label="Nomic Embed Text",
                provider="ollama",
                provider_model="nomic-embed-text",
                task="embedding",
                local=True,
                dimensions=3,
            ),
            ModelDefinition(
                id="openai/gpt-5-5",
                label="OpenAI GPT-5.5",
                provider="openai",
                provider_model="gpt-5.5",
                task="chat",
                local=False,
            ),
        ]
    )
    service = GatewayService(
        catalog=catalog,
        ollama_url="http://ollama.test",
        anthropic_api_key="",
        openai_api_key="",
    )
    fake_provider = FakeProvider()
    service.providers["ollama"] = fake_provider
    return service, fake_provider


class GatewayServiceTest(unittest.TestCase):
    def test_lists_models_by_task(self):
        """
        BDD Scenario: model task filtering.

        Given: chat and embedding models are registered.
        When: chat models are listed.
        Then: only chat model metadata is returned.
        """
        service, _ = build_service()

        models = service.list_models(task="chat")

        self.assertEqual(models["data"][0]["id"], "qwen/qwen3-1-7b")

    def test_routes_chat_to_selected_provider_model(self):
        """
        BDD Scenario: selected chat model.

        Given: a gateway chat request uses a public model id.
        When: the service dispatches the request.
        Then: the provider receives the mapped provider model id.
        """
        service, fake_provider = build_service()

        response = service.chat_completion(
            TestChatRequest(
                model="qwen/qwen3-1-7b",
                messages=[TestMessage(role="user", content="hello")],
            )
        )

        self.assertEqual(response["model"], "qwen/qwen3-1-7b")
        self.assertEqual(response["provider_model"], "qwen3:1.7b")
        self.assertEqual(response["choices"][0]["message"]["content"], "answer")
        self.assertEqual(fake_provider.chat_calls[0]["model"].provider_model, "qwen3:1.7b")

    def test_returns_openai_compatible_embeddings(self):
        """
        BDD Scenario: embedding response shape.

        Given: an embedding model is registered.
        When: the service embeds one input.
        Then: the response uses OpenAI-compatible embedding items.
        """
        service, fake_provider = build_service()

        response = service.embeddings(
            TestEmbeddingRequest(model="nomic/nomic-embed-text", input="hello")
        )

        self.assertEqual(response["data"][0]["embedding"], [0.1, 0.2, 0.3])
        self.assertEqual(
            fake_provider.embed_calls[0]["model"].provider_model,
            "nomic-embed-text",
        )

    def test_unknown_model_lists_available_ids(self):
        """
        BDD Scenario: unknown model.

        Given: a request references a model outside the preset catalog.
        When: the service validates the id.
        Then: the error includes available model ids.
        """
        service, _ = build_service()

        with self.assertRaises(GatewayError) as context:
            service.chat_completion(
                TestChatRequest(
                    model="qwen/unknown",
                    messages=[TestMessage(role="user", content="hello")],
                )
            )

        self.assertIn("qwen/qwen3-1-7b", context.exception.details["available_models"])

    def test_forwards_provider_skills_to_matching_provider(self):
        """
        BDD Scenario: provider skill dispatch.

        Given: a chat model is backed by OpenAI.
        When: provider_skills contain OpenAI references.
        Then: the selected provider receives those references.
        """
        service, _ = build_service()
        fake_provider = FakeProvider()
        service.providers["openai"] = fake_provider

        service.chat_completion(
            TestChatRequest(
                model="openai/gpt-5-5",
                messages=[TestMessage(role="user", content="hello")],
                provider_skills=[
                    TestProviderSkill(
                        provider="openai",
                        provider_skill_id="skill_openai_1",
                    )
                ],
            )
        )

        self.assertEqual(
            fake_provider.chat_calls[0]["provider_skills"][0].provider_skill_id,
            "skill_openai_1",
        )

    def test_rejects_provider_skills_for_unsupported_provider(self):
        """
        BDD Scenario: unsupported provider skills.

        Given: a chat model is backed by a local provider.
        When: provider_skills are supplied.
        Then: the gateway fails clearly instead of silently ignoring them.
        """
        service, _ = build_service()

        with self.assertRaises(GatewayError) as context:
            service.chat_completion(
                TestChatRequest(
                    model="qwen/qwen3-1-7b",
                    messages=[TestMessage(role="user", content="hello")],
                    provider_skills=[
                        TestProviderSkill(
                            provider="openai",
                            provider_skill_id="skill_openai_1",
                        )
                    ],
                )
            )

        self.assertEqual(context.exception.error_type, "unsupported_parameter")


class OpenAIProviderTest(unittest.TestCase):
    def setUp(self):
        self.previous_openai_module = sys.modules.get("openai")

    def tearDown(self):
        if self.previous_openai_module is not None:
            sys.modules["openai"] = self.previous_openai_module
        else:
            sys.modules.pop("openai", None)

    def test_chat_completion_uses_max_completion_tokens_for_gpt_5(self):
        """
        BDD Scenario: GPT-5 chat completion token limit.

        Given: OpenAI GPT-5 models reject `max_tokens`.
        When: the OpenAI provider calls Chat Completions.
        Then: it sends `max_completion_tokens` and omits temperature.
        """
        calls = []

        class FakeCompletions:
            def create(self, **kwargs):
                calls.append(kwargs)
                message = types.SimpleNamespace(content="answer")
                choice = types.SimpleNamespace(message=message)
                usage = types.SimpleNamespace(
                    prompt_tokens=2,
                    completion_tokens=3,
                    total_tokens=5,
                )
                return types.SimpleNamespace(choices=[choice], usage=usage)

        class FakeOpenAI:
            def __init__(self, api_key):
                self.chat = types.SimpleNamespace(
                    completions=FakeCompletions(),
                )

        sys.modules["openai"] = types.SimpleNamespace(OpenAI=FakeOpenAI)

        provider = OpenAIProvider(api_key="test-key")
        model = ModelDefinition(
            id="openai/gpt-5-5",
            label="OpenAI GPT-5.5",
            provider="openai",
            provider_model="gpt-5.5",
            task="chat",
            local=False,
        )

        result = provider.chat(
            model,
            [TestMessage(role="user", content="hello")],
            temperature=0.2,
            max_tokens=120,
        )

        self.assertEqual(result.text, "answer")
        self.assertEqual(calls[0]["max_completion_tokens"], 120)
        self.assertNotIn("max_tokens", calls[0])
        self.assertNotIn("temperature", calls[0])

    def test_openai_errors_are_returned_as_gateway_errors(self):
        """
        BDD Scenario: OpenAI provider error.

        Given: OpenAI rejects a request.
        When: the provider receives the SDK exception.
        Then: callers get a GatewayError with provider details.
        """

        class FakeOpenAIError(Exception):
            status_code = 400

        class FakeCompletions:
            def create(self, **kwargs):
                raise FakeOpenAIError("unsupported parameter")

        class FakeOpenAI:
            def __init__(self, api_key):
                self.chat = types.SimpleNamespace(
                    completions=FakeCompletions(),
                )

        sys.modules["openai"] = types.SimpleNamespace(OpenAI=FakeOpenAI)

        provider = OpenAIProvider(api_key="test-key")
        model = ModelDefinition(
            id="openai/gpt-5-5",
            label="OpenAI GPT-5.5",
            provider="openai",
            provider_model="gpt-5.5",
            task="chat",
            local=False,
        )

        with self.assertRaises(GatewayError) as context:
            provider.chat(model, [TestMessage(role="user", content="hello")])

        self.assertIn("OpenAI generation request failed with status 400", str(context.exception))
        self.assertEqual(context.exception.error_type, "provider_error")

    def test_responses_api_mounts_provider_skills(self):
        """
        BDD Scenario: OpenAI provider-native skills.

        Given: OpenAI provider receives synced skill references.
        When: the provider calls the Responses API.
        Then: the shell tool environment contains skill_reference entries.
        """
        calls = []

        class FakeResponses:
            def create(self, **kwargs):
                calls.append(kwargs)
                usage = types.SimpleNamespace(
                    input_tokens=2,
                    output_tokens=3,
                    total_tokens=5,
                )
                return types.SimpleNamespace(output_text="answer", usage=usage)

        class FakeOpenAI:
            def __init__(self, api_key):
                self.responses = FakeResponses()

        sys.modules["openai"] = types.SimpleNamespace(OpenAI=FakeOpenAI)

        provider = OpenAIProvider(api_key="test-key")
        model = ModelDefinition(
            id="openai/gpt-5-5",
            label="OpenAI GPT-5.5",
            provider="openai",
            provider_model="gpt-5.5",
            task="chat",
            local=False,
        )

        result = provider.chat(
            model,
            [TestMessage(role="user", content="hello")],
            provider_skills=[
                TestProviderSkill(
                    provider="openai",
                    provider_skill_id="skill_openai_1",
                    version="v1",
                )
            ],
        )

        self.assertEqual(result.text, "answer")
        self.assertEqual(
            calls[0]["tools"][0]["environment"]["skills"],
            [
                {
                    "type": "skill_reference",
                    "skill_id": "skill_openai_1",
                    "version": "v1",
                }
            ],
        )


class AnthropicProviderTest(unittest.TestCase):
    def setUp(self):
        self.previous_anthropic_module = sys.modules.get("anthropic")

    def tearDown(self):
        if self.previous_anthropic_module is not None:
            sys.modules["anthropic"] = self.previous_anthropic_module
        else:
            sys.modules.pop("anthropic", None)

    def test_beta_messages_mount_provider_skills(self):
        """
        BDD Scenario: Anthropic provider-native skills.

        Given: Anthropic provider receives synced custom skill references.
        When: the provider calls beta Messages.
        Then: container.skills includes custom skill references and code execution is enabled.
        """
        calls = []

        class FakeBetaMessages:
            def create(self, **kwargs):
                calls.append(kwargs)
                usage = types.SimpleNamespace(input_tokens=2, output_tokens=3)
                return types.SimpleNamespace(
                    content=[types.SimpleNamespace(type="text", text="answer")],
                    usage=usage,
                )

        class FakeMessages:
            def create(self, **kwargs):
                raise AssertionError("plain Messages API should not be used")

        class FakeAnthropic:
            def __init__(self, api_key):
                self.beta = types.SimpleNamespace(messages=FakeBetaMessages())
                self.messages = FakeMessages()

        sys.modules["anthropic"] = types.SimpleNamespace(Anthropic=FakeAnthropic)

        provider = AnthropicProvider(api_key="test-key")
        model = ModelDefinition(
            id="anthropic/claude-opus-4-7",
            label="Claude Opus 4.7",
            provider="anthropic",
            provider_model="claude-opus-4-7",
            task="chat",
            local=False,
        )

        result = provider.chat(
            model,
            [TestMessage(role="user", content="hello")],
            provider_skills=[
                TestProviderSkill(
                    provider="anthropic",
                    provider_skill_id="skill_anthropic_1",
                    version="v1",
                )
            ],
        )

        self.assertEqual(result.text, "answer")
        self.assertIn("skills-2025-10-02", calls[0]["betas"])
        self.assertEqual(
            calls[0]["container"]["skills"],
            [
                {
                    "type": "custom",
                    "skill_id": "skill_anthropic_1",
                    "version": "v1",
                }
            ],
        )
        self.assertEqual(
            calls[0]["tools"],
            [{"type": "code_execution_20250825", "name": "code_execution"}],
        )


if __name__ == "__main__":
    unittest.main()
