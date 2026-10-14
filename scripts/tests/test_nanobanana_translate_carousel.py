"""Testes do script de tradução (sem rede): regras de uso e prompt."""
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import nanobanana_translate_carousel as script  # noqa: E402


class PromptTest(unittest.TestCase):
    def test_prompt_nao_troca_marcas(self):
        p = script.TRANSLATION_PROMPT
        self.assertNotIn("Robô de Date", p)
        self.assertNotIn("Wing", p)
        self.assertIn("do not replace, add or remove any brand name", p)


class UsoTest(unittest.TestCase):
    def test_exige_confirmacao_de_criativos_proprios(self):
        env = {**os.environ, "GEMINI_API_KEY": "chave-de-teste"}
        r = subprocess.run(
            [sys.executable, os.path.join(ROOT, "nanobanana_translate_carousel.py"), ROOT, os.path.join(ROOT, "tests")],
            capture_output=True,
            text=True,
            env=env,
        )
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("--criativos-proprios", r.stderr)


if __name__ == "__main__":
    unittest.main()
