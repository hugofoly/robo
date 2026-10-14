#!/usr/bin/env python3
"""Translate a folder of English carousel slides to Brazilian Portuguese
using the Gemini image model known as "Nano Banana" (gemini-3.1-flash-image).

Only the text on each slide is translated; the rest of the image is meant to
stay identical. Brand names are never replaced. Quality depends on the model,
so always spot-check the output before publishing.

Use only with creatives that belong to Robô de Date or that you are licensed
to adapt. Translating a third party's ad (its photos, models, illustrations or
app screens) needs the rights holder's authorization, and swapping a
competitor's brand into it would turn their claims and testimonials into ours.

Usage:
    export GEMINI_API_KEY=...
    python3 nanobanana_translate_carousel.py <input_dir> <output_dir> --criativos-proprios

Requires only the Python standard library.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request

DEFAULT_MODEL = "gemini-3.1-flash-image"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 4

TRANSLATION_PROMPT = (
    "Translate ALL visible text in this image to Brazilian Portuguese (pt-BR). "
    "Keep the exact same layout, position, font style, weight, size and color "
    "for each text block. Do not change, redraw, move or restyle anything else "
    "in the image: same background, same photos, illustrations, logos, icons "
    "and app mockups, pixel-identical outside of the translated text. Keep "
    "every brand, product and person name exactly as written: do not replace, "
    "add or remove any brand name. If the literal translation is "
    "too long to fit the original text box, shorten it naturally without "
    "losing the meaning. Output only the edited image."
)

MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def load_api_key(key_file: str | None) -> str:
    if key_file:
        return open(key_file, encoding="utf-8").read().strip()
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit(
            "GEMINI_API_KEY não definida. Exporte a variável de ambiente ou "
            "use --key-file apontando para um arquivo com a chave."
        )
    return key


def translate_image(api_key: str, model: str, image_path: str) -> bytes:
    ext = os.path.splitext(image_path)[1].lower()
    mime_type = MIME_TYPES[ext]
    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("ascii")

    body = {
        "contents": [{
            "parts": [
                {"text": TRANSLATION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": img_b64}},
            ]
        }],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )

    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.load(resp)
            parts = data["candidates"][0]["content"]["parts"]
            for part in parts:
                inline = part.get("inlineData") or part.get("inline_data")
                if inline:
                    return base64.b64decode(inline["data"])
            raise RuntimeError(f"Resposta sem imagem: {json.dumps(data)[:500]}")
        except (urllib.error.HTTPError, urllib.error.URLError, RuntimeError, KeyError) as exc:
            last_error = exc
            if attempt < MAX_ATTEMPTS:
                time.sleep(RETRY_BACKOFF_SECONDS * attempt)
    raise RuntimeError(f"Falhou após {MAX_ATTEMPTS} tentativas: {last_error}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_dir", help="Pasta com os slides em inglês")
    parser.add_argument("output_dir", help="Pasta de saída para os slides em português")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Modelo Gemini (default: {DEFAULT_MODEL})")
    parser.add_argument("--key-file", default=None, help="Arquivo com a GEMINI_API_KEY (senão usa a env var)")
    parser.add_argument(
        "--criativos-proprios",
        action="store_true",
        help="Confirma que os criativos são do Robô de Date ou licenciados para adaptação (obrigatório)",
    )
    args = parser.parse_args()

    if not args.criativos_proprios:
        sys.exit(
            "Use só com criativos do Robô de Date ou licenciados. Confirme com --criativos-proprios.\n"
            "Anúncios de terceiros (fotos, modelos, ilustrações, telas de app) precisam de autorização de quem tem os direitos."
        )

    api_key = load_api_key(args.key_file)
    os.makedirs(args.output_dir, exist_ok=True)

    files = sorted(
        f for f in os.listdir(args.input_dir)
        if os.path.splitext(f)[1].lower() in IMAGE_EXTENSIONS
    )
    if not files:
        sys.exit(f"Nenhuma imagem encontrada em {args.input_dir}")

    ok, failed = [], []
    for name in files:
        in_path = os.path.join(args.input_dir, name)
        out_path = os.path.join(args.output_dir, name)
        print(f"Traduzindo {name} ...", flush=True)
        try:
            img_bytes = translate_image(api_key, args.model, in_path)
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            ok.append(name)
            print(f"  -> ok ({len(img_bytes)} bytes)")
        except Exception as exc:  # noqa: BLE001 - report and continue with next slide
            failed.append((name, str(exc)))
            print(f"  -> FALHOU: {exc}")

    print(f"\nConcluído: {len(ok)} ok, {len(failed)} falharam.")
    if failed:
        print("Slides com falha (revise manualmente):")
        for name, err in failed:
            print(f"  - {name}: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main()
