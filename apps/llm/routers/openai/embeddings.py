from fastapi import APIRouter

from singlepage.errors import GatewayError
from singlepage.schemas import EmbeddingRequest
from startup.service import get_service
from .errors import handle_gateway_error

router = APIRouter()


@router.post("/embeddings")
async def create_embedding(request: EmbeddingRequest):
    try:
        return get_service().embeddings(request)
    except GatewayError as error:
        return handle_gateway_error(error)
