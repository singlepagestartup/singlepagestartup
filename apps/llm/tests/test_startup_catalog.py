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
