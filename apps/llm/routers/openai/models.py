from fastapi import APIRouter, Query

from singlepage.catalog import ModelTask
from singlepage.errors import GatewayError
from startup.service import get_service
from .errors import handle_gateway_error

router = APIRouter()


@router.get("/models")
async def list_models(task: ModelTask | None = Query(default=None)):
    return get_service().list_models(task=task)


@router.get("/models/{model_id:path}")
async def retrieve_model(model_id: str):
    try:
        return get_service().get_model(model_id)
    except GatewayError as error:
        return handle_gateway_error(error)
