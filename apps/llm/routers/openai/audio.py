"""
OpenAI-compatible audio endpoints.

POST /v1/audio/transcriptions  — Whisper transcription (same interface as OpenAI)
"""
import os
import tempfile

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse
from config import settings

router = APIRouter()

SUPPORTED_MODELS = {
    "whisper-1",
    settings.whisper_model,
}


@router.post("/transcriptions")
async def create_transcription(
    file: UploadFile,
    model: str = Form(settings.whisper_model),
    language: str = Form(None),
    response_format: str = Form("json"),
    prompt: str = Form(None),
):
    if model not in SUPPORTED_MODELS:
        raise HTTPException(status_code=400, detail=f"Unknown model: {model}")

    suffix = os.path.splitext(file.filename or "audio")[1] or ".mp3"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await file.read())
        path = tmp.name

    try:
        try:
            from services.openai import whisper
        except ImportError as error:
            raise HTTPException(
                status_code=501,
                detail=(
                    "Local audio transcription is disabled in this image. "
                    "Install optional Whisper/PyTorch dependencies to enable it."
                ),
            ) from error

        text = whisper.transcribe(path, language=language, initial_prompt=prompt)

        if response_format == "text":
            return PlainTextResponse(text)
        return {"text": text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(path)
