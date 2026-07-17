"""
BDD Suite: persistent Ollama model reconciliation.

Given: the Ollama init service is configured with required model ids.
When: a configured model is missing from the Ollama runtime.
Then: the service pulls the model and remains active for future checks.
"""

import os
import pathlib
import subprocess
import tempfile
import time
import unittest


class OllamaInitTest(unittest.TestCase):
    def test_missing_models_are_pulled_without_stopping_the_reconciler(self):
        """
        BDD Scenario: missing models are restored by a persistent process.

        Given: Ollama is reachable and one of two configured models is missing.
        When: the model reconciler performs its first check.
        Then: it pulls only the missing model and continues running.
        """
        script_path = pathlib.Path(__file__).resolve().parents[1] / "ollama-init.sh"

        with tempfile.TemporaryDirectory() as temporary_directory:
            temporary_path = pathlib.Path(temporary_directory)
            model_state_path = temporary_path / "models"
            command_log_path = temporary_path / "commands"
            fake_ollama_path = temporary_path / "ollama"

            model_state_path.write_text("existing-model\n", encoding="utf-8")
            fake_ollama_path.write_text(
                """#!/bin/sh
set -eu
printf '%s\\n' "$*" >> "$OLLAMA_TEST_COMMAND_LOG"

case "$1" in
  list)
    exit 0
    ;;
  show)
    grep -Fxq "$2" "$OLLAMA_TEST_MODEL_STATE"
    ;;
  pull)
    printf '%s\\n' "$2" >> "$OLLAMA_TEST_MODEL_STATE"
    exit 0
    ;;
  *)
    exit 1
    ;;
esac
""",
                encoding="utf-8",
            )
            fake_ollama_path.chmod(0o755)

            environment = os.environ.copy()
            environment.update(
                {
                    "OLLAMA_MODEL_IDS": "existing-model, missing-model",
                    "OLLAMA_MODEL_RECONCILE_INTERVAL_SECONDS": "1",
                    "OLLAMA_TEST_COMMAND_LOG": str(command_log_path),
                    "OLLAMA_TEST_MODEL_STATE": str(model_state_path),
                    "PATH": f"{temporary_path}:{environment['PATH']}",
                }
            )

            process = subprocess.Popen(
                ["/bin/sh", str(script_path)],
                env=environment,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )

            try:
                deadline = time.monotonic() + 5
                while time.monotonic() < deadline:
                    if command_log_path.exists() and "pull missing-model" in (
                        command_log_path.read_text(encoding="utf-8")
                    ):
                        break
                    time.sleep(0.05)
                else:
                    self.fail("The reconciler did not pull the missing model.")

                self.assertIsNone(process.poll())
                command_log = command_log_path.read_text(encoding="utf-8")
                self.assertNotIn("pull existing-model", command_log)
            finally:
                process.terminate()
                process.communicate(timeout=5)


if __name__ == "__main__":
    unittest.main()
