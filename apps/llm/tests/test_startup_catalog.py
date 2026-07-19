"""
BDD Suite: startup model catalog.

Given: apps/llm exposes project-specific model presets.
When: the startup catalog is built.
Then: current hosted and local model slugs map to provider model ids.
"""

import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from startup.catalog import build_catalog


class StartupCatalogTest(unittest.TestCase):
    def test_embedding_model_comes_from_gateway_environment(self):
        """
        BDD Scenario: environment-selected Ollama embedding model.

        Given: apps/llm is configured with Qwen3 Embedding 4B.
        When: the startup catalog is built.
        Then: the stable local embedding alias maps to that Ollama model at 768 dimensions.
        """
        catalog = build_catalog(
            embedding_provider_model="qwen3-embedding:4b",
            embedding_dimensions=768,
        )

        model = catalog.get("local/default-embedding")

        self.assertEqual(model.provider, "ollama")
        self.assertEqual(model.provider_model, "qwen3-embedding:4b")
        self.assertEqual(model.dimensions, 768)

    def test_openai_gpt_5_5_is_available(self):
        """
        BDD Scenario: OpenAI GPT-5.5 preset.

        Given: OpenAI GPT-5.5 is an official API model id.
        When: callers request the public SPS slug.
        Then: the catalog maps it to the OpenAI provider model.
        """
        catalog = build_catalog()

        model = catalog.get("openai/gpt-5-5")

        self.assertEqual(model.label, "OpenAI GPT-5.5")
        self.assertEqual(model.provider, "openai")
        self.assertEqual(model.provider_model, "gpt-5.5")
        self.assertEqual(model.task, "chat")


if __name__ == "__main__":
    unittest.main()
