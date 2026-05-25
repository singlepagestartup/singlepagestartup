from fastapi import APIRouter

from singlepage.errors import GatewayError
from singlepage.schemas import ChatCompletionRequest
from startup.service import get_service
from .errors import handle_gateway_error

router = APIRouter()


@router.post("/chat/completions")
async def create_chat_completion(request: ChatCompletionRequest):
    try:
        return get_service().chat_completion(request)
    except GatewayError as error:
        return handle_gateway_error(error)
