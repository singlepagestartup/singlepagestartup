from openai import OpenAI
from config import settings

_client: OpenAI | None = None


def get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def fix_transcription(text: str) -> str:
    if not settings.openai_api_key:
        return text

    client = get_client()
    response = client.chat.completions.create(
        model="gpt-5-mini-2025-08-07",
        messages=[
            {
                "role": "system",
                "content": (
                    "Ты редактор транскрипций. "
                    "Получаешь сырой текст из speech-to-text модели: без знаков препинания, "
                    "без заглавных букв, с возможными ошибками в именах, аббревиатурах и терминах. "
                    "Твоя задача:\n"
                    "1. Расставить знаки препинания\n"
                    "2. Восстановить заглавные буквы\n"
                    "3. Исправить очевидные ошибки распознавания по контексту \n"
                    "4. НЕ изменять смысл, не добавлять и не убирать информацию\n"
                    "5. Вернуть только исправленный текст, без пояснений"
                ),
            },
            {"role": "user", "content": text},
        ],
    )
    return response.choices[0].message.content.strip()
