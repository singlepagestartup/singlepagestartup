class GatewayError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_type: str = "gateway_error",
        details: dict | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_type = error_type
        self.details = details or {}
        super().__init__(message)


def error_response(error: GatewayError):
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=error.status_code,
        content={
            "error": {
                "message": error.message,
                "type": error.error_type,
                **error.details,
            }
        },
    )
