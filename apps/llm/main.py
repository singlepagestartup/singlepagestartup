import asyncio
import warnings
from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.openai import audio, chat, embeddings, models
from services.openai import whisper
from startup.service import preload_configured_models


warnings.filterwarnings("ignore", category=FutureWarning, module="transformers")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Pre-load audio and configured HuggingFace models on startup.
    print("Loading Whisper model...")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, whisper.get_pipeline)
    await loop.run_in_executor(None, preload_configured_models)
    print("Model ready.")
    yield


app = FastAPI(
    title="LLM Service",
    description="OpenAI-compatible local inference server",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(models.router, prefix="/v1", tags=["models"])
app.include_router(chat.router, prefix="/v1", tags=["chat"])
app.include_router(embeddings.router, prefix="/v1", tags=["embeddings"])
app.include_router(audio.router, prefix="/v1/audio", tags=["audio"])


@app.get("/health")
async def health():
    return {"status": "ok"}
