__all__ = ["get_service"]


def __getattr__(name: str):
    if name == "get_service":
        from .service import get_service

        return get_service

    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
