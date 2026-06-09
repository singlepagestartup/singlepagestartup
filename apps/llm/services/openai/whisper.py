import os
import threading
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline
from config import settings
from services.openai.postprocess import fix_transcription

_pipe = None
_lock = threading.Lock()

MODEL_ID = settings.whisper_model


def get_pipeline():
    global _pipe
    if _pipe is None:
        with _lock:
            if _pipe is None:
                if settings.hf_token:
                    os.environ["HF_TOKEN"] = settings.hf_token

                device = settings.whisper_device
                dtype = torch.float16 if device == "cuda" else torch.float32

                model = AutoModelForSpeechSeq2Seq.from_pretrained(
                    MODEL_ID,
                    torch_dtype=dtype,
                    low_cpu_mem_usage=True,
                    token=settings.hf_token or None,
                )
                model.to(device)

                processor = AutoProcessor.from_pretrained(
                    MODEL_ID,
                    token=settings.hf_token or None,
                )

                # Silence attention mask warning: pad_token != eos_token
                model.config.pad_token_id = processor.tokenizer.pad_token_id

                _pipe = pipeline(
                    "automatic-speech-recognition",
                    model=model,
                    tokenizer=processor.tokenizer,
                    feature_extractor=processor.feature_extractor,
                    torch_dtype=dtype,
                    device=device,
                    generate_kwargs={"forced_decoder_ids": None},
                )
    return _pipe


def transcribe(
    audio_path: str,
    language: str | None = None,
    initial_prompt: str | None = None,
) -> str:
    pipe = get_pipeline()
    generate_kwargs = {}
    if language:
        generate_kwargs["language"] = language
    if initial_prompt:
        generate_kwargs["prompt_ids"] = pipe.tokenizer.get_prompt_ids(
            initial_prompt, return_tensors="pt"
        )
    result = pipe(
        audio_path,
        return_timestamps=True,
        chunk_length_s=30,
        stride_length_s=5,
        generate_kwargs=generate_kwargs,
    )
    raw_text = result["text"].strip()
    return fix_transcription(raw_text)
